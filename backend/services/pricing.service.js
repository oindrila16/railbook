/**
 * Dynamic pricing engine.
 *
 * Final price = basePrice × occupancyMultiplier × timeMultiplier
 * (clamped between min and max multiplier limits)
 */
const pricingConfig = require('../config/pricing');
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');
const routeFareModel = require('../models/routeFare.model');
const {
  normalizeFareClass,
  listFareClasses,
  pickFareForClass,
  buildFareOption,
} = require('./fareClass.service');

const { parseISODateLocal, getTodayISO } = require('../utils/dates');

function getDaysUntilDeparture(travelDate) {
  const today = parseISODateLocal(getTodayISO());
  const travel = parseISODateLocal(travelDate);
  return Math.ceil((travel - today) / (1000 * 60 * 60 * 24));
}

/**
 * Occupancy tier from % seats booked.
 */
function getOccupancyTier(occupancyPercent) {
  const { occupancy } = pricingConfig;

  if (occupancyPercent >= occupancy.mediumMaxPercent) {
    return {
      tier: 'high',
      multiplier: occupancy.highMultiplier,
      label: `${occupancy.mediumMaxPercent}–100% seats booked`,
      surchargePercent: Math.round((occupancy.highMultiplier - 1) * 100),
      description: `+${Math.round((occupancy.highMultiplier - 1) * 100)}% (high demand)`,
    };
  }
  if (occupancyPercent >= occupancy.baseMaxPercent) {
    return {
      tier: 'medium',
      multiplier: occupancy.mediumMultiplier,
      label: `${occupancy.baseMaxPercent}–${occupancy.mediumMaxPercent - 1}% seats booked`,
      surchargePercent: Math.round((occupancy.mediumMultiplier - 1) * 100),
      description: `+${Math.round((occupancy.mediumMultiplier - 1) * 100)}% (moderate demand)`,
    };
  }
  return {
    tier: 'base',
    multiplier: occupancy.baseMultiplier,
    label: `0–${occupancy.baseMaxPercent - 1}% seats booked`,
    surchargePercent: 0,
    description: 'Base price (low demand)',
  };
}

/**
 * Time-based multiplier from days until travel date.
 */
function getTimeTier(travelDate) {
  const daysUntil = getDaysUntilDeparture(travelDate);
  const { time } = pricingConfig;

  if (daysUntil <= time.urgentDays) {
    return {
      tier: 'urgent',
      daysUntil,
      multiplier: time.urgentMultiplier,
      label: 'Departure within 24 hours',
      surchargePercent: Math.round((time.urgentMultiplier - 1) * 100),
      description: `+${Math.round((time.urgentMultiplier - 1) * 100)}% (last-minute)`,
    };
  }
  if (daysUntil <= time.soonDays) {
    return {
      tier: 'soon',
      daysUntil,
      multiplier: time.soonMultiplier,
      label: `Departure within ${time.soonDays} days`,
      surchargePercent: Math.round((time.soonMultiplier - 1) * 100),
      description: `+${Math.round((time.soonMultiplier - 1) * 100)}% (short notice)`,
    };
  }
  if (daysUntil <= time.nearDays) {
    return {
      tier: 'near',
      daysUntil,
      multiplier: time.nearMultiplier,
      label: `Departure within ${time.nearDays} days`,
      surchargePercent: Math.round((time.nearMultiplier - 1) * 100),
      description: `+${Math.round((time.nearMultiplier - 1) * 100)}% (approaching departure)`,
    };
  }
  return {
    tier: 'normal',
    daysUntil,
    multiplier: time.normalMultiplier,
    label: 'Departure more than 7 days away',
    surchargePercent: 0,
    description: 'No time surcharge',
  };
}

function clampMultiplier(multiplier) {
  const { minMultiplier, maxMultiplier } = pricingConfig.limits;
  return Math.min(maxMultiplier, Math.max(minMultiplier, multiplier));
}

/**
 * Core price calculation with full transparent breakdown.
 */
function calculatePrice(basePrice, bookedSeats, totalSeats, travelDate) {
  const base = Number(basePrice);
  const booked = Number(bookedSeats);
  const total = Number(totalSeats);

  const occupancyPercent = total > 0 ? Math.round((booked / total) * 100) : 0;
  const availableSeats = Math.max(0, total - booked);

  const occupancyTier = getOccupancyTier(occupancyPercent);
  const timeTier = getTimeTier(travelDate);

  const rawCombined = occupancyTier.multiplier * timeTier.multiplier;
  const combinedMultiplier = clampMultiplier(Math.round(rawCombined * 100) / 100);

  const currentPrice = Math.round(base * combinedMultiplier * 100) / 100;
  const surchargeAmount = Math.round((currentPrice - base) * 100) / 100;

  const wasClamped = rawCombined !== combinedMultiplier;
  const offerMeta = computeOfferPricing({
    basePrice: base,
    regularPrice: currentPrice,
    occupancyPercent,
    daysUntilDeparture: timeTier.daysUntil,
  });

  return {
    currency: pricingConfig.currency,
    currencySymbol: pricingConfig.currencySymbol,
    basePrice: base,
    currentPrice,
    pricePerSeat: currentPrice,
    surchargeAmount,
    surchargePercent: base > 0 ? Math.round((surchargeAmount / base) * 100) : 0,
    occupancyPercent,
    availableSeats,
    bookedSeats: booked,
    totalSeats: total,
    pricingTier: occupancyTier.tier,
    daysUntilDeparture: timeTier.daysUntil,
    multipliers: {
      occupancy: occupancyTier.multiplier,
      time: timeTier.multiplier,
      combined: combinedMultiplier,
      rawCombined: Math.round(rawCombined * 100) / 100,
      wasClamped,
    },
    breakdown: {
      occupancy: occupancyTier,
      time: timeTier,
      formula: `${pricingConfig.currencySymbol}${base} × ${occupancyTier.multiplier} (occupancy) × ${timeTier.multiplier} (time) = ${pricingConfig.currencySymbol}${currentPrice}`,
    },
    ...offerMeta,
  };
}

/**
 * Offer fare — discounted and always below regular (base/list) price.
 */
function computeOfferPricing({ basePrice, regularPrice, occupancyPercent, daysUntilDeparture }) {
  const { offer } = pricingConfig;
  const base = Number(basePrice);
  const regular = Number(regularPrice);

  const eligible =
    daysUntilDeparture >= offer.minDaysAhead &&
    occupancyPercent <= offer.maxOccupancyPercent;

  if (!eligible) {
    return {
      regularPrice: base,
      offerPrice: null,
      hasOffer: false,
      savings: 0,
      savingsPercent: 0,
    };
  }

  let offerPrice = Math.round(regular * offer.discountMultiplier);
  const cap = Math.round(base * offer.maxPercentOfBase);
  offerPrice = Math.min(offerPrice, cap, base - 1, regular - 1);
  offerPrice = Math.max(1, offerPrice);

  const hasOffer = offerPrice < base && offerPrice < regular;
  const savings = hasOffer ? base - offerPrice : 0;

  return {
    regularPrice: base,
    offerPrice: hasOffer ? offerPrice : null,
    hasOffer,
    savings,
    savingsPercent: hasOffer && base > 0 ? Math.round((savings / base) * 100) : 0,
  };
}

/**
 * Total cost for multiple passengers at the same per-seat price.
 */
function calculateBookingTotal(priceResult, passengerCount) {
  const count = Math.max(1, passengerCount);
  const totalAmount = Math.round(priceResult.currentPrice * count * 100) / 100;

  return {
    ...priceResult,
    passengerCount: count,
    totalAmount,
    pricePerSeat: priceResult.currentPrice,
  };
}

/**
 * Simulate how price would change if additional seats were booked.
 */
function projectPriceAfterBooking(basePrice, bookedSeats, totalSeats, travelDate, additionalSeats = 1) {
  const current = calculatePrice(basePrice, bookedSeats, totalSeats, travelDate);
  const projected = calculatePrice(
    basePrice,
    bookedSeats + additionalSeats,
    totalSeats,
    travelDate
  );

  return {
    current: current.currentPrice,
    projected: projected.currentPrice,
    priceIncrease: Math.round((projected.currentPrice - current.currentPrice) * 100) / 100,
    occupancyAfter: projected.occupancyPercent,
    tierAfter: projected.pricingTier,
  };
}

/**
 * Public pricing rules for documentation / UI.
 */
function getPricingRules() {
  const { occupancy, time, limits, currency, currencySymbol } = pricingConfig;

  return {
    currency,
    currencySymbol,
    formula: 'finalPrice = basePrice × occupancyMultiplier × timeMultiplier (per fare class)',
    fareClasses: listFareClasses(),
    occupancyTiers: [
      {
        range: `0–${occupancy.baseMaxPercent - 1}%`,
        tier: 'base',
        multiplier: occupancy.baseMultiplier,
        description: 'Base price',
      },
      {
        range: `${occupancy.baseMaxPercent}–${occupancy.mediumMaxPercent - 1}%`,
        tier: 'medium',
        multiplier: occupancy.mediumMultiplier,
        description: `+${Math.round((occupancy.mediumMultiplier - 1) * 100)}%`,
      },
      {
        range: `${occupancy.mediumMaxPercent}–100%`,
        tier: 'high',
        multiplier: occupancy.highMultiplier,
        description: `+${Math.round((occupancy.highMultiplier - 1) * 100)}%`,
      },
    ],
    timeTiers: [
      { condition: `>${time.nearDays} days before departure`, multiplier: time.normalMultiplier },
      { condition: `${time.soonDays + 1}–${time.nearDays} days`, multiplier: time.nearMultiplier },
      { condition: `${time.urgentDays + 1}–${time.soonDays} days`, multiplier: time.soonMultiplier },
      { condition: `≤${time.urgentDays} day(s)`, multiplier: time.urgentMultiplier },
    ],
    limits: {
      minMultiplier: limits.minMultiplier,
      maxMultiplier: limits.maxMultiplier,
    },
  };
}

/**
 * Live price quote for a specific route + date (used by GET /pricing/quote).
 */
async function getPriceQuote({ routeId, travelDate, passengerCount = 1, fareClass }) {
  const normalizedClass = fareClass ? normalizeFareClass(fareClass) : 'economy';
  if (fareClass && !normalizedClass) {
    throw ApiError.badRequest('fareClass must be economy, business, or first');
  }

  const [rows] = await pool.query(
    `SELECT r.id AS route_id, t.base_price, t.total_seats,
            COALESCE(seat_stats.booked_seats, 0) AS booked_seats,
            t.train_number, t.name AS train_name,
            src.code AS source_code, dest.code AS destination_code
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     LEFT JOIN (
       SELECT tk.route_id, COUNT(*) AS booked_seats
       FROM tickets tk
       INNER JOIN bookings b ON b.id = tk.booking_id
       WHERE tk.travel_date = ?
         AND tk.status = 'active'
         AND b.status IN ('confirmed', 'pending')
       GROUP BY tk.route_id
     ) seat_stats ON seat_stats.route_id = r.id
     WHERE r.id = ? AND r.is_active = 1 AND t.is_active = 1`,
    [travelDate, routeId]
  );

  if (!rows.length) {
    throw ApiError.notFound('Route not found or inactive');
  }

  const row = rows[0];
  const routeFares = await routeFareModel.findByRouteId(routeId);
  const bookedByClass = await routeFareModel.countBookedByClassForRoutes([routeId], travelDate);
  const bookedMap = bookedByClass.reduce((acc, b) => {
    acc[b.fare_class] = Number(b.booked_count);
    return acc;
  }, {});

  let fares;
  if (routeFares.length) {
    fares = routeFares.map((f) =>
      buildFareOption(f, bookedMap[f.fare_class] || 0, travelDate)
    );
  } else {
    const booked = Number(row.booked_seats);
    const total = Number(row.total_seats);
    fares = [
      buildFareOption(
        { fare_class: 'economy', base_price: row.base_price, seat_quota: total },
        booked,
        travelDate
      ),
    ];
  }

  const selected = pickFareForClass(fares, normalizedClass);
  const classBooked = selected.availability.bookedSeats;
  const classQuota = selected.seatQuota;

  const pricing = calculatePrice(
    selected.basePrice,
    classBooked,
    classQuota,
    travelDate
  );
  const bookingTotal = calculateBookingTotal(pricing, passengerCount);
  const projection = projectPriceAfterBooking(
    selected.basePrice,
    classBooked,
    classQuota,
    travelDate,
    passengerCount
  );

  return {
    routeId: row.route_id,
    travelDate,
    fareClass: selected.class,
    fareClassLabel: selected.label,
    train: { number: row.train_number, name: row.train_name },
    route: { source: row.source_code, destination: row.destination_code },
    fares,
    availability: {
      bookedSeats: classBooked,
      availableSeats: selected.availability.availableSeats,
      seatQuota: classQuota,
      occupancyPercent: pricing.occupancyPercent,
      canBook: selected.availability.availableSeats >= passengerCount,
      isFull: selected.availability.isFull,
    },
    pricing: bookingTotal,
    projection: {
      message: `If ${passengerCount} more seat(s) are booked in ${selected.label}, price may change`,
      ...projection,
    },
    rules: getPricingRules(),
  };
}

module.exports = {
  calculatePrice,
  computeOfferPricing,
  calculateBookingTotal,
  projectPriceAfterBooking,
  getOccupancyTier,
  getTimeTier,
  getDaysUntilDeparture,
  getPricingRules,
  getPriceQuote,
  getOccupancyMultiplier: (pct) => getOccupancyTier(pct).multiplier,
  getTimeMultiplier: (date) => getTimeTier(date).multiplier,
};
