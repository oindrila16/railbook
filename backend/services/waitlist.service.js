/**
 * Waitlist queue: join, status, cancel, and automatic FIFO promotion on cancellation.
 */
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const routeModel = require('../models/route.model');
const ticketModel = require('../models/ticket.model');
const waitlistModel = require('../models/waitlist.model');
const bookingModel = require('../models/booking.model');
const { allocateSeats } = require('../utils/seatAllocator');
const { getSeatRangeForClass } = require('../utils/seatRange');
const { generateBookingReference } = require('../utils/bookingReference');
const pricingService = require('./pricing.service');
const routeFareModel = require('../models/routeFare.model');
const { normalizeFareClass } = require('../config/fareClasses');
const notificationService = require('./notification.service');
const { broadcastSeatUpdate } = require('../socket');

function emitSeatUpdate(routeId, travelDate, reason) {
  broadcastSeatUpdate(routeId, travelDate, { reason }).catch((err) => {
    console.warn('[Socket.IO] Emit failed:', err.message);
  });
}

function parsePassengers(passengersJson) {
  if (!passengersJson) {
    return { passengers: [], fareClass: 'economy' };
  }
  let data = passengersJson;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { passengers: [], fareClass: 'economy' };
    }
  }
  if (Array.isArray(data)) {
    return { passengers: data, fareClass: 'economy' };
  }
  return {
    passengers: data.passengers || [],
    fareClass: data.fareClass || 'economy',
  };
}

function formatWaitlistEntry(row, extras = {}) {
  return {
    id: row.id,
    routeId: row.route_id,
    travelDate: row.travel_date,
    position: row.position,
    passengerCount: row.passenger_count,
    status: row.status,
    bookingId: row.booking_id,
    bookingReference: row.booking_reference || null,
    notifiedAt: row.notified_at,
    createdAt: row.created_at,
    train: {
      number: row.train_number,
      name: row.train_name,
      class: row.train_class,
    },
    route: {
      source: row.source_code,
      sourceName: row.source_name,
      destination: row.destination_code,
      destinationName: row.destination_name,
    },
    queue: extras.queue || null,
  };
}

/**
 * Promote the next waiting entry inside an open transaction.
 * Returns null if queue empty or insufficient seats.
 */
async function promoteNextInQueue(connection, routeId, travelDate) {
  const route = await routeModel.findByIdForUpdate(connection, routeId);
  if (!route) return null;

  const waitlistEntry = await waitlistModel.getNextWaitingForUpdate(
    connection,
    routeId,
    travelDate
  );
  if (!waitlistEntry) return null;

  const { passengers, fareClass } = parsePassengers(waitlistEntry.passengers_json);
  if (!passengers.length) {
    await waitlistModel.updateStatus(connection, waitlistEntry.id, 'expired');
    await waitlistModel.rebalancePositionsAfter(
      connection,
      routeId,
      travelDate,
      waitlistEntry.position
    );
    return { skipped: true, reason: 'invalid_passengers', waitlistId: waitlistEntry.id };
  }

  const normalizedClass = normalizeFareClass(fareClass) || 'economy';
  const routeFares = await routeFareModel.findByRouteId(routeId);
  const routeFare = routeFares.find((f) => f.fare_class === normalizedClass);
  const seatRange = routeFares.length
    ? getSeatRangeForClass(routeFares, normalizedClass)
    : {
        quota: route.total_seats,
        minSeat: 1,
        maxSeat: route.total_seats,
      };
  const classQuota = seatRange.quota;

  const bookedInClass = await routeFareModel.countBookedByClassForUpdate(
    connection,
    routeId,
    travelDate,
    normalizedClass
  );

  if (bookedInClass + passengers.length > classQuota) {
    return null;
  }

  const bookedSeats = await ticketModel.getBookedSeatsForUpdate(
    connection,
    routeId,
    travelDate
  );

  const seats = allocateSeats(
    seatRange.minSeat,
    seatRange.maxSeat,
    bookedSeats,
    passengers.length
  );
  if (!seats) return null;

  const basePrice = routeFare ? Number(routeFare.base_price) : Number(route.base_price);

  const pricing = pricingService.calculatePrice(
    basePrice,
    bookedInClass,
    classQuota,
    travelDate
  );
  const bookingPricing = pricingService.calculateBookingTotal(
    pricing,
    passengers.length
  );
  const ticketPrice = bookingPricing.currentPrice;
  const totalAmount = bookingPricing.totalAmount;
  const bookingReference = generateBookingReference();

  const bookingId = await bookingModel.create(connection, {
    bookingReference,
    userId: waitlistEntry.user_id,
    routeId,
    travelDate,
    status: 'confirmed',
    totalAmount,
    seatCount: passengers.length,
    fareClass: normalizedClass,
    basePriceSnapshot: pricing.basePrice,
    finalPriceSnapshot: ticketPrice,
    pricingFactor: pricing.multipliers.combined,
    pricingBreakdown: bookingPricing,
  });

  await ticketModel.createMany(
    connection,
    passengers.map((p, i) => ({
      bookingId,
      routeId,
      travelDate,
      passengerName: p.name,
      passengerAge: p.age,
      passengerGender: p.gender,
      seatNumber: seats[i],
      ticketPrice,
      fareClass: normalizedClass,
    }))
  );

  const promotedPosition = waitlistEntry.position;
  await waitlistModel.updateStatus(connection, waitlistEntry.id, 'confirmed', bookingId);
  await waitlistModel.rebalancePositionsAfter(
    connection,
    routeId,
    travelDate,
    promotedPosition
  );

  return {
    promoted: true,
    waitlistId: waitlistEntry.id,
    userId: waitlistEntry.user_id,
    previousPosition: promotedPosition,
    bookingId,
    bookingReference,
    seats,
    totalAmount,
    passengerCount: passengers.length,
  };
}

/**
 * Process FIFO queue after cancellation — promotes as many users as seats allow.
 */
async function processQueueAfterCancellation(routeId, travelDate) {
  const connection = await pool.getConnection();
  const promotions = [];

  try {
    await connection.beginTransaction();

    let safety = 50;
    while (safety > 0) {
      safety -= 1;
      const result = await promoteNextInQueue(connection, routeId, travelDate);
      if (!result) break;
      if (result.promoted) promotions.push(result);
    }

    await connection.commit();

    for (const promo of promotions) {
      const booking = await bookingModel.findById(promo.bookingId);
      const [userRows] = await pool.query(
        'SELECT email, phone FROM users WHERE id = ?',
        [promo.userId]
      );
      const contact = userRows[0];
      if (contact) {
        await notificationService.sendWaitlistConfirmation(
          contact,
          { position: promo.previousPosition, travel_date: travelDate },
          booking
        );
      }
    }

    if (promotions.length > 0) {
      emitSeatUpdate(routeId, travelDate, 'waitlist_promoted');
    }

    return {
      promotedCount: promotions.length,
      promotions: promotions.map((p) => ({
        waitlistId: p.waitlistId,
        userId: p.userId,
        bookingId: p.bookingId,
        bookingReference: p.bookingReference,
        seats: p.seats,
        totalAmount: p.totalAmount,
      })),
    };
  } catch (err) {
    await connection.rollback();
    console.error('Waitlist queue processing failed:', err.message);
    return { promotedCount: 0, promotions: [], error: err.message };
  } finally {
    connection.release();
  }
}

async function addToWaitlist(connection, { userId, routeId, travelDate, passengers, fareClass }) {
  const existing = await waitlistModel.findByUserRouteDate(
    connection,
    userId,
    routeId,
    travelDate
  );
  if (existing) {
    throw ApiError.conflict('You are already on the waitlist for this train and date');
  }

  const position = await waitlistModel.getNextPosition(connection, routeId, travelDate);
  const normalizedClass = normalizeFareClass(fareClass) || 'economy';
  const waitlistId = await waitlistModel.create(connection, {
    userId,
    routeId,
    travelDate,
    position,
    passengerCount: passengers.length,
    passengers: { fareClass: normalizedClass, passengers },
  });

  return { waitlistId, position };
}

/**
 * POST /waitlist/join — explicitly join waitlist when train is full.
 */
async function joinWaitlist(userId, { routeId, travelDate, passengers, fareClass }) {
  if (!passengers?.length) {
    throw ApiError.badRequest('At least one passenger is required');
  }

  const normalizedClass = normalizeFareClass(fareClass);
  if (fareClass && !normalizedClass) {
    throw ApiError.badRequest('fareClass must be economy, business, or first');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const route = await routeModel.findByIdForUpdate(connection, routeId);
    if (!route || !route.route_active || !route.train_active) {
      throw ApiError.notFound('Route or train not found or inactive');
    }

    const classForWaitlist = normalizedClass || 'economy';
    const routeFares = await routeFareModel.findByRouteId(routeId);
    const seatRange = routeFares.length
      ? getSeatRangeForClass(routeFares, classForWaitlist)
      : { quota: route.total_seats };
    const bookedInClass = await routeFareModel.countBookedByClassForUpdate(
      connection,
      routeId,
      travelDate,
      classForWaitlist
    );
    const availableInClass = seatRange.quota - bookedInClass;

    if (availableInClass >= passengers.length) {
      throw ApiError.badRequest(
        `Seats are available in ${classForWaitlist} (${availableInClass}). Book via POST /bookings instead.`
      );
    }

    const waitlist = await addToWaitlist(connection, {
      userId,
      routeId,
      travelDate,
      passengers,
      fareClass: normalizedClass || 'economy',
    });

    const totalInQueue = await waitlistModel.countWaiting(connection, routeId, travelDate);

    await connection.commit();

    const [userRows] = await pool.query(
      'SELECT email, phone FROM users WHERE id = ?',
      [userId]
    );
    const contact = userRows[0];
    if (contact) {
      await notificationService.sendWaitlistJoined(
        contact,
        { position: waitlist.position, travel_date: travelDate, totalInQueue },
        {
          totalInQueue,
          train: { number: route.train_number, name: route.train_name },
          route: { source: route.source_code, destination: route.destination_code },
        }
      );
    }

    emitSeatUpdate(routeId, travelDate, 'waitlist_joined');

    return {
      message: 'Added to waitlist successfully',
      waitlist: {
        id: waitlist.waitlistId,
        position: waitlist.position,
        totalInQueue,
        routeId,
        travelDate,
        passengerCount: passengers.length,
      },
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * GET /waitlist/status — user's waitlist entries with queue position info.
 */
async function getWaitlistStatus(userId, { routeId, travelDate } = {}) {
  const entries = await waitlistModel.findByUserId(userId, { routeId, travelDate });

  const formatted = await Promise.all(
    entries.map(async (row) => {
      let queue = null;
      if (row.status === 'waiting') {
        const ahead = await waitlistModel.countAhead(
          row.route_id,
          row.travel_date,
          row.position
        );
        const totalInQueue = await waitlistModel.countWaiting(
          row.route_id,
          row.travel_date
        );
        queue = {
          position: row.position,
          passengersAhead: ahead,
          totalInQueue,
          isNextInLine: ahead === 0,
        };
      }

      return formatWaitlistEntry(row, { queue });
    })
  );

  const waiting = formatted.filter((e) => e.status === 'waiting');
  const confirmed = formatted.filter((e) => e.status === 'confirmed');

  return {
    summary: {
      total: formatted.length,
      waiting: waiting.length,
      confirmed: confirmed.length,
    },
    entries: formatted,
  };
}

/**
 * DELETE /waitlist/:id — leave the waitlist (waiting entries only).
 */
async function cancelWaitlistEntry(userId, waitlistId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const entry = await waitlistModel.findByIdForUpdate(connection, waitlistId);
    if (!entry) throw ApiError.notFound('Waitlist entry not found');
    if (entry.user_id !== userId) {
      throw ApiError.forbidden('You can only cancel your own waitlist entry');
    }
    if (entry.status !== 'waiting') {
      throw ApiError.badRequest(`Cannot cancel waitlist entry with status: ${entry.status}`);
    }

    const { route_id: routeId, travel_date: travelDate, position } = entry;

    await waitlistModel.updateStatus(connection, waitlistId, 'cancelled');
    await waitlistModel.rebalancePositionsAfter(connection, routeId, travelDate, position);

    await connection.commit();

    return {
      message: 'Removed from waitlist successfully',
      waitlistId,
      routeId,
      travelDate,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  processQueueAfterCancellation,
  promoteNextInQueue,
  addToWaitlist,
  joinWaitlist,
  getWaitlistStatus,
  cancelWaitlistEntry,
};
