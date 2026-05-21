/**
 * Build fare-class options with dynamic pricing and per-class availability.
 */
const routeFareModel = require('../models/routeFare.model');

/** Lazy load avoids circular dependency with pricing.service */
function calculateFarePrice(basePrice, booked, quota, travelDate) {
  const pricingService = require('./pricing.service');
  return pricingService.calculatePrice(basePrice, booked, quota, travelDate);
}
const {
  FARE_CLASSES,
  FARE_CLASS_IDS,
  getFareClassLabel,
  normalizeFareClass,
} = require('../config/fareClasses');

function buildFareOption(fareRow, bookedInClass, travelDate) {
  const seatQuota = Number(fareRow.seat_quota);
  const bookedSeats = Number(bookedInClass);
  const availableSeats = Math.max(0, seatQuota - bookedSeats);
  const pricing = calculateFarePrice(
    fareRow.base_price,
    bookedSeats,
    seatQuota,
    travelDate
  );

  const fareClass = fareRow.fare_class;

  return {
    class: fareClass,
    label: getFareClassLabel(fareClass),
    order: FARE_CLASSES[fareClass]?.order ?? 99,
    basePrice: pricing.basePrice,
    currentPrice: pricing.currentPrice,
    regularPrice: pricing.regularPrice ?? pricing.basePrice,
    offerPrice: pricing.offerPrice ?? null,
    hasOffer: Boolean(pricing.hasOffer),
    savings: pricing.savings ?? 0,
    savingsPercent: pricing.savingsPercent ?? 0,
    seatQuota,
    availability: {
      bookedSeats,
      availableSeats,
      occupancyPercent: pricing.occupancyPercent,
      isFull: availableSeats === 0,
    },
    pricing: {
      currency: pricing.currency,
      basePrice: pricing.basePrice,
      currentPrice: pricing.currentPrice,
      regularPrice: pricing.regularPrice ?? pricing.basePrice,
      offerPrice: pricing.offerPrice,
      hasOffer: Boolean(pricing.hasOffer),
      savings: pricing.savings ?? 0,
      savingsPercent: pricing.savingsPercent ?? 0,
      surchargeAmount: pricing.surchargeAmount,
      surchargePercent: pricing.surchargePercent,
      tier: pricing.pricingTier,
      daysUntilDeparture: pricing.daysUntilDeparture,
      multipliers: pricing.multipliers,
      breakdown: pricing.breakdown,
    },
  };
}

/**
 * Attach fares[] to search rows. Falls back to train base_price as economy-only.
 */
async function enrichSearchResults(rows, travelDate, preferredFareClass = null) {
  const routeIds = rows.map((r) => r.route_id);
  const fareRows = await routeFareModel.findByRouteIds(routeIds);
  const bookedRows = await routeFareModel.countBookedByClassForRoutes(routeIds, travelDate);

  const faresByRoute = fareRows.reduce((acc, f) => {
    if (!acc[f.route_id]) acc[f.route_id] = [];
    acc[f.route_id].push(f);
    return acc;
  }, {});

  const bookedMap = bookedRows.reduce((acc, b) => {
    acc[`${b.route_id}:${b.fare_class}`] = Number(b.booked_count);
    return acc;
  }, {});

  return rows.map((row) => {
    const routeFares = faresByRoute[row.route_id];
    let fares;

    if (routeFares?.length) {
      fares = routeFares.map((f) =>
        buildFareOption(f, bookedMap[`${row.route_id}:${f.fare_class}`] || 0, travelDate)
      );
    } else {
      const booked = Number(row.booked_seats);
      const total = Number(row.total_seats);
      const synthetic = {
        fare_class: 'economy',
        base_price: row.base_price,
        seat_quota: total,
      };
      fares = [buildFareOption(synthetic, booked, travelDate)];
    }

    const selectedFare =
      pickFareForClass(fares, preferredFareClass || 'economy') || fares[0];
    const totalBooked = Number(row.booked_seats);
    const totalSeats = Number(row.total_seats);

    return {
      fares,
      selectedFare,
      totalAvailability: {
        bookedSeats: selectedFare.availability.bookedSeats,
        availableSeats: selectedFare.availability.availableSeats,
        occupancyPercent: selectedFare.availability.occupancyPercent,
        isFull: selectedFare.availability.isFull,
        waitlistCount: Number(row.waitlist_count),
      },
    };
  });
}

function pickFareForClass(fares, fareClass) {
  const normalized = normalizeFareClass(fareClass) || 'economy';
  return fares.find((f) => f.class === normalized) || fares[0];
}

function listFareClasses() {
  return FARE_CLASS_IDS.map((id) => ({
    id,
    label: getFareClassLabel(id),
    order: FARE_CLASSES[id].order,
  }));
}

module.exports = {
  FARE_CLASS_IDS,
  enrichSearchResults,
  pickFareForClass,
  buildFareOption,
  getFareClassLabel,
  normalizeFareClass,
  listFareClasses,
};
