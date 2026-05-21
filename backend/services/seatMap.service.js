/**
 * Train coach seat map — multiple coaches with chair or sleeper layouts.
 */
const ApiError = require('../utils/ApiError');
const routeModel = require('../models/route.model');
const routeFareModel = require('../models/routeFare.model');
const ticketModel = require('../models/ticket.model');
const pricingService = require('./pricing.service');
const { buildMultiCoachLayout } = require('../utils/trainSeatLayout');
const { getSeatRangeForClass, filterBookedInRange } = require('../utils/seatRange');
const { normalizeFareClass, getFareClassLabel } = require('../config/fareClasses');
const { parseISODateLocal, getTodayISO } = require('../utils/dates');

function applySeatStatus(seat, bookedSet) {
  return {
    ...seat,
    status: bookedSet.has(seat.id.toUpperCase()) ? 'booked' : 'available',
  };
}

function enrichChairCoach(coach, bookedSet) {
  const seats = coach.seats.map((s) => applySeatStatus(s, bookedSet));
  const rows = coach.rows.map((row) => ({
    rowNumber: row.rowNumber,
    seats: row.seats.map((s) => applySeatStatus(s, bookedSet)),
  }));
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  return {
    id: coach.id,
    label: coach.label,
    layoutType: 'chair',
    columns: coach.columns,
    aisleAfter: coach.aisleAfter,
    seatCount: coach.seatCount,
    availableSeats,
    layout: { rows },
    seats,
  };
}

function enrichSleeperCoach(coach, bookedSet) {
  const seats = coach.seats.map((s) => applySeatStatus(s, bookedSet));
  const rows = coach.rows.map((row) => ({
    bayNumber: row.bayNumber,
    rowNumber: row.rowNumber,
    sides: row.sides.map((side) => ({
      side: side.side,
      berths: side.berths.map((s) => applySeatStatus(s, bookedSet)),
    })),
  }));
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  return {
    id: coach.id,
    label: coach.label,
    layoutType: 'sleeper',
    seatCount: coach.seatCount,
    availableSeats,
    layout: { rows },
    seats,
  };
}

async function getSeatMap(routeId, travelDate, fareClassInput) {
  const fareClass = normalizeFareClass(fareClassInput) || 'economy';

  const route = await routeModel.findById(routeId);
  if (!route || !route.route_active || !route.train_active) {
    throw ApiError.notFound('Route or train not found');
  }

  const travel = parseISODateLocal(travelDate);
  const today = parseISODateLocal(getTodayISO());
  if (travel < today) {
    throw ApiError.badRequest('Travel date cannot be in the past');
  }

  const routeFares = await routeFareModel.findByRouteId(routeId);
  const routeFare = routeFares.find((f) => f.fare_class === fareClass);
  const seatRange = routeFares.length
    ? getSeatRangeForClass(routeFares, fareClass)
    : {
        offset: 0,
        quota: Number(route.total_seats),
        minSeat: 1,
        maxSeat: Number(route.total_seats),
      };
  const classQuota = seatRange.quota;
  const basePrice = routeFare ? Number(routeFare.base_price) : Number(route.base_price);

  const bookedRows = await ticketModel.getBookedSeatsActive(routeId, travelDate);
  const bookedInRange = filterBookedInRange(
    bookedRows,
    seatRange.minSeat,
    seatRange.maxSeat
  );
  const bookedSet = new Set(bookedInRange.map((s) => s.toUpperCase()));

  const bookedInClass = await routeFareModel.countBookedByClass(routeId, travelDate, fareClass);
  const pricing = pricingService.calculatePrice(basePrice, bookedInClass, classQuota, travelDate);

  const multi = buildMultiCoachLayout(classQuota, route.train_class, seatRange.offset);
  const coaches = multi.coaches.map((coach) =>
    coach.layoutType === 'sleeper'
      ? enrichSleeperCoach(coach, bookedSet)
      : enrichChairCoach(coach, bookedSet)
  );

  const availableCount = coaches.reduce((sum, c) => sum + c.availableSeats, 0);
  const isSleeper = multi.layoutType === 'sleeper';

  const legend = [
    { key: 'available', label: 'Available' },
    { key: 'selected', label: 'Selected' },
    { key: 'booked', label: 'Not available' },
  ];
  if (isSleeper) {
    legend.push({ key: 'upper', label: 'Upper berth (U)' });
    legend.push({ key: 'lower', label: 'Lower berth (L)' });
  }

  return {
    routeId: Number(routeId),
    travelDate,
    fareClass,
    fareClassLabel: getFareClassLabel(fareClass),
    train: {
      number: route.train_number,
      name: route.train_name,
      class: route.train_class,
    },
    route: {
      source: route.source_code,
      sourceName: route.source_name,
      destination: route.destination_code,
      destinationName: route.destination_name,
    },
    schedule: {
      departureTime: route.departure_time,
      arrivalTime: route.arrival_time,
    },
    layoutType: multi.layoutType,
    directionLabel: 'Direction of travel →',
    coaches,
    coachCount: coaches.length,
    pricing,
    availability: {
      classQuota,
      bookedInClass,
      availableSeats: availableCount,
      isFull: availableCount === 0 || bookedInClass >= classQuota,
      seatRange: {
        minSeat: seatRange.minSeat,
        maxSeat: seatRange.maxSeat,
      },
    },
    legend,
  };
}

module.exports = { getSeatMap };
