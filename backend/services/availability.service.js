/**
 * Builds real-time seat availability snapshots for Socket.IO broadcasts.
 */
const availabilityModel = require('../models/availability.model');
const routeFareModel = require('../models/routeFare.model');
const { buildFareOption, pickFareForClass, normalizeFareClass } = require('./fareClass.service');

function formatTravelDate(date) {
  if (!date) return date;
  if (date instanceof Date) {
    return date.toISOString().slice(0, 10);
  }
  return String(date).slice(0, 10);
}

async function buildFaresForRoute(row, travelDate) {
  const routeId = row.route_id;
  const routeFares = await routeFareModel.findByRouteId(routeId);
  const bookedByClass = await routeFareModel.countBookedByClassForRoutes([routeId], travelDate);
  const bookedMap = bookedByClass.reduce((acc, b) => {
    acc[b.fare_class] = Number(b.booked_count);
    return acc;
  }, {});

  if (routeFares.length) {
    return routeFares.map((f) => buildFareOption(f, bookedMap[f.fare_class] || 0, travelDate));
  }

  const booked = Number(row.booked_seats);
  const total = Number(row.total_seats);
  return [
    buildFareOption(
      { fare_class: 'economy', base_price: row.base_price, seat_quota: total },
      booked,
      travelDate
    ),
  ];
}

async function getSnapshot(routeId, travelDate, fareClassInput) {
  const date = formatTravelDate(travelDate);
  const row = await availabilityModel.getRouteAvailability(routeId, date);

  if (!row) {
    return {
      routeId: Number(routeId),
      travelDate: date,
      found: false,
    };
  }

  const bookedSeats = Number(row.booked_seats);
  const totalSeats = Number(row.total_seats);
  const availableSeats = Math.max(0, totalSeats - bookedSeats);
  const fares = await buildFaresForRoute(row, date);
  const preferredClass = fareClassInput ? normalizeFareClass(fareClassInput) : null;
  const selected = pickFareForClass(fares, preferredClass || 'economy');

  return {
    found: true,
    routeId: row.route_id,
    travelDate: date,
    train: {
      id: row.train_id,
      number: row.train_number,
      name: row.train_name,
      class: row.train_class,
      totalSeats,
    },
    route: {
      source: row.source_code,
      sourceName: row.source_name,
      destination: row.destination_code,
      destinationName: row.destination_name,
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
    },
    fares,
    fareClass: selected.class,
    fareClassLabel: selected.label,
    availability: {
      bookedSeats: selected.availability.bookedSeats,
      availableSeats: selected.availability.availableSeats,
      seatQuota: selected.seatQuota,
      totalBookedSeats: bookedSeats,
      totalAvailableSeats: availableSeats,
      totalSeats,
      occupancyPercent: selected.availability.occupancyPercent,
      isFull: selected.availability.isFull,
      waitlistCount: Number(row.waitlist_count),
    },
    pricing: {
      basePrice: selected.basePrice,
      currentPrice: selected.currentPrice,
      tier: selected.pricing.tier,
      multipliers: selected.pricing.multipliers,
    },
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { getSnapshot, formatTravelDate };
