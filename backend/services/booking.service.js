/**
 * Booking business logic with MySQL transactions and automatic seat allocation.
 */
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const routeModel = require('../models/route.model');
const bookingModel = require('../models/booking.model');
const ticketModel = require('../models/ticket.model');
const userModel = require('../models/user.model');
const { resolveSeatAssignment } = require('../utils/seatAllocator');
const { getSeatRangeForClass } = require('../utils/seatRange');
const { generateBookingReference } = require('../utils/bookingReference');
const pricingService = require('./pricing.service');
const routeFareModel = require('../models/routeFare.model');
const { normalizeFareClass, getFareClassLabel } = require('../config/fareClasses');
const waitlistService = require('./waitlist.service');
const notificationService = require('./notification.service');
const { broadcastSeatUpdate } = require('../socket');
const { parseISODateLocal, getTodayISO } = require('../utils/dates');

function emitSeatUpdate(routeId, travelDate, reason) {
  broadcastSeatUpdate(routeId, travelDate, { reason }).catch((err) => {
    console.warn('[Socket.IO] Emit failed:', err.message);
  });
}

function formatTicket(row) {
  return {
    id: row.id,
    passengerName: row.passenger_name,
    passengerAge: row.passenger_age,
    passengerGender: row.passenger_gender,
    seatNumber: row.seat_number,
    ticketPrice: Number(row.ticket_price),
    status: row.status,
  };
}

function formatBooking(row, tickets = []) {
  return {
    id: row.id,
    bookingReference: row.booking_reference,
    routeId: row.route_id,
    travelDate: row.travel_date,
    status: row.status,
    totalAmount: Number(row.total_amount),
    seatCount: row.seat_count,
    pricing: {
      basePrice: row.base_price_snapshot ? Number(row.base_price_snapshot) : null,
      finalPricePerSeat: row.final_price_snapshot ? Number(row.final_price_snapshot) : null,
      factor: row.pricing_factor ? Number(row.pricing_factor) : null,
      breakdown: row.pricing_breakdown
        ? typeof row.pricing_breakdown === 'string'
          ? JSON.parse(row.pricing_breakdown)
          : row.pricing_breakdown
        : null,
    },
    fareClass: row.fare_class || 'economy',
    fareClassLabel: getFareClassLabel(row.fare_class || 'economy'),
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
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    tickets: tickets.map(formatTicket),
  };
}

/**
 * Create booking inside an existing transaction.
 */
async function createConfirmedBooking(connection, {
  userId,
  route,
  travelDate,
  passengers,
  fareClass: fareClassInput,
}) {
  const routeId = route.route_id;
  const totalSeats = route.total_seats;
  const fareClass = normalizeFareClass(fareClassInput) || 'economy';

  const routeFares = await routeFareModel.findByRouteId(routeId);
  const routeFare = routeFares.find((f) => f.fare_class === fareClass);
  const basePrice = routeFare ? Number(routeFare.base_price) : Number(route.base_price);
  const seatRange = routeFares.length
    ? getSeatRangeForClass(routeFares, fareClass)
    : { quota: totalSeats, minSeat: 1, maxSeat: totalSeats };
  const classQuota = seatRange.quota;

  const bookedInClass = await routeFareModel.countBookedByClassForUpdate(
    connection,
    routeId,
    travelDate,
    fareClass
  );

  if (bookedInClass + passengers.length > classQuota) {
    return { success: false, reason: 'full' };
  }

  const bookedSeats = await ticketModel.getBookedSeatsForUpdate(
    connection,
    routeId,
    travelDate
  );

  const seatResult = resolveSeatAssignment(passengers, seatRange, bookedSeats);
  if (!seatResult.ok) {
    if (seatResult.error === 'full') {
      return { success: false, reason: 'full' };
    }
    throw ApiError.badRequest(seatResult.error);
  }
  const seats = seatResult.seats;

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
    userId,
    routeId,
    travelDate,
    status: 'confirmed',
    totalAmount,
    seatCount: passengers.length,
    fareClass,
    basePriceSnapshot: pricing.basePrice,
    finalPriceSnapshot: ticketPrice,
    pricingFactor: pricing.multipliers.combined,
    pricingBreakdown: bookingPricing,
  });

  const ticketRows = passengers.map((p, i) => ({
    bookingId,
    routeId,
    travelDate,
    passengerName: p.name,
    passengerAge: p.age,
    passengerGender: p.gender,
    seatNumber: seats[i],
    ticketPrice,
    fareClass,
  }));

  await ticketModel.createMany(connection, ticketRows);

  return {
    success: true,
    bookingId,
    bookingReference,
    seats,
    totalAmount,
    ticketPrice,
    pricing: bookingPricing,
  };
}

/**
 * POST /bookings — book tickets or join waitlist if full.
 */
async function createBooking(userId, { routeId, travelDate, passengers, fareClass }) {
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

    const travel = parseISODateLocal(travelDate);
    const today = parseISODateLocal(getTodayISO());
    if (travel < today) {
      throw ApiError.badRequest('Travel date cannot be in the past');
    }

    const result = await createConfirmedBooking(connection, {
      userId,
      route,
      travelDate,
      passengers,
      fareClass: normalizedClass || 'economy',
    });

    if (!result.success) {
      const waitlist = await waitlistService.addToWaitlist(connection, {
        userId,
        routeId,
        travelDate,
        passengers,
        fareClass: normalizedClass || 'economy',
      });
      await connection.commit();

      const user = await pool.query(
        'SELECT email, phone FROM users WHERE id = ?',
        [userId]
      );
      const contact = user[0][0];
      if (contact) {
        await notificationService.sendWaitlistJoined(
          contact,
          { position: waitlist.position, travel_date: travelDate },
          {
            train: { number: route.train_number, name: route.train_name },
            route: { source: route.source_code, destination: route.destination_code },
          }
        );
      }

      emitSeatUpdate(routeId, travelDate, 'waitlist_joined');

      return {
        status: 'waitlisted',
        message: 'Train is full. You have been added to the waitlist.',
        waitlist: {
          id: waitlist.waitlistId,
          position: waitlist.position,
          routeId,
          travelDate,
          passengerCount: passengers.length,
        },
      };
    }

    await connection.commit();

    const booking = await bookingModel.findById(result.bookingId);
    const tickets = await ticketModel.findByBookingId(result.bookingId);
    const userRows = await pool.query(
      'SELECT email, phone FROM users WHERE id = ?',
      [userId]
    );
    const contact = userRows[0][0];
    if (contact) {
      try {
        await notificationService.sendBookingConfirmation(contact, booking, tickets);
      } catch (notifyErr) {
        console.warn('[Booking] Confirmation notification failed:', notifyErr.message);
      }
    }

    emitSeatUpdate(routeId, travelDate, 'booking_created');

    return {
      status: 'confirmed',
      message: 'Booking confirmed successfully',
      pricing: result.pricing,
      booking: formatBooking(booking, tickets),
    };
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      throw ApiError.conflict('Seat conflict detected. Please try again.');
    }
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * GET /bookings/user — list authenticated user's bookings.
 */
async function getUserBookings(userId) {
  const bookings = await bookingModel.findByUserId(userId);
  if (!bookings.length) {
    return { count: 0, bookings: [] };
  }

  const bookingIds = bookings.map((b) => b.id);
  const allTickets = await ticketModel.findByBookingIds(bookingIds);
  const ticketsByBooking = allTickets.reduce((acc, t) => {
    if (!acc[t.booking_id]) acc[t.booking_id] = [];
    acc[t.booking_id].push(t);
    return acc;
  }, {});

  return {
    count: bookings.length,
    bookings: bookings.map((b) => formatBooking(b, ticketsByBooking[b.id] || [])),
  };
}

/**
 * DELETE /bookings/:id — cancel booking and promote waitlist if possible.
 */
async function cancelBooking(userId, bookingId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const booking = await bookingModel.findByIdForUpdate(connection, bookingId);
    if (!booking) {
      throw ApiError.notFound('Booking not found');
    }
    if (booking.user_id !== userId) {
      throw ApiError.forbidden('You can only cancel your own bookings');
    }
    if (booking.status === 'cancelled') {
      throw ApiError.badRequest('Booking is already cancelled');
    }
    if (booking.status === 'waitlisted') {
      throw ApiError.badRequest('Waitlisted bookings cannot be cancelled via this endpoint');
    }

    const travel = new Date(booking.travel_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    travel.setHours(0, 0, 0, 0);
    if (travel < today) {
      throw ApiError.badRequest('Cannot cancel a booking for a past travel date');
    }

    await ticketModel.cancelByBookingId(connection, bookingId);
    await bookingModel.updateStatus(connection, bookingId, 'cancelled');

    const { route_id: routeId, travel_date: travelDate } = booking;

    await connection.commit();

    const updated = await bookingModel.findById(bookingId);
    const userRows = await pool.query(
      'SELECT email, phone FROM users WHERE id = ?',
      [userId]
    );
    const contact = userRows[0][0];
    if (contact) {
      await notificationService.sendCancellationNotification(contact, updated);
    }

    const waitlistPromotion = await waitlistService.processQueueAfterCancellation(
      routeId,
      travelDate
    );

    emitSeatUpdate(routeId, travelDate, 'booking_cancelled');

    return {
      message: 'Booking cancelled successfully',
      booking: formatBooking(updated, await ticketModel.findByBookingId(bookingId)),
      waitlistPromotion,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { createBooking, getUserBookings, cancelBooking, formatBooking };
