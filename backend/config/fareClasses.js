/**
 * Travel fare classes (ticket cabin tiers).
 * Economy base comes from route_fares; Business/First use configured multipliers at seed time.
 */
const FARE_CLASSES = {
  economy: {
    id: 'economy',
    label: 'Economy',
    order: 1,
  },
  business: {
    id: 'business',
    label: 'Business',
    order: 2,
  },
  first: {
    id: 'first',
    label: 'First Class',
    order: 3,
  },
};

const FARE_CLASS_IDS = Object.keys(FARE_CLASSES);

/** Seat share of total train capacity per class */
const SEAT_QUOTA_PERCENT = {
  economy: 0.65,
  business: 0.25,
  first: 0.1,
};

/** Base price multipliers applied to train.base_price when seeding route_fares */
const BASE_PRICE_MULTIPLIER = {
  economy: 1,
  business: 1.55,
  first: 2.35,
};

function isValidFareClass(value) {
  return typeof value === 'string' && FARE_CLASS_IDS.includes(value.toLowerCase());
}

function normalizeFareClass(value) {
  const id = String(value || 'economy').toLowerCase();
  if (!isValidFareClass(id)) return null;
  return id;
}

function getFareClassLabel(id) {
  return FARE_CLASSES[id]?.label ?? id;
}

module.exports = {
  FARE_CLASSES,
  FARE_CLASS_IDS,
  SEAT_QUOTA_PERCENT,
  BASE_PRICE_MULTIPLIER,
  isValidFareClass,
  normalizeFareClass,
  getFareClassLabel,
};
