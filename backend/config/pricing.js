/**
 * Dynamic pricing configuration — adjustable via environment variables.
 *
 * Occupancy tiers (spec):
 *   0–50%  → base price (1.0)
 *   50–80% → +20% (1.2)
 *   80–100%→ +40% (1.4)
 *
 * Time tiers (days until departure):
 *   ≤1 day  → +15%
 *   ≤3 days → +8%
 *   ≤7 days → +3%
 */
require('dotenv').config();

const parseFloatEnv = (key, fallback) => {
  const val = parseFloat(process.env[key]);
  return Number.isFinite(val) ? val : fallback;
};

const parseIntEnv = (key, fallback) => {
  const val = parseInt(process.env[key], 10);
  return Number.isFinite(val) ? val : fallback;
};

module.exports = {
  currency: process.env.PRICING_CURRENCY || 'BDT',
  currencySymbol: process.env.PRICING_CURRENCY_SYMBOL || '৳',

  occupancy: {
    baseMaxPercent: parseIntEnv('PRICING_OCCUPANCY_BASE_MAX', 50),
    mediumMaxPercent: parseIntEnv('PRICING_OCCUPANCY_MEDIUM_MAX', 80),
    baseMultiplier: parseFloatEnv('PRICING_OCCUPANCY_BASE_MULT', 1.0),
    mediumMultiplier: parseFloatEnv('PRICING_OCCUPANCY_MEDIUM_MULT', 1.2),
    highMultiplier: parseFloatEnv('PRICING_OCCUPANCY_HIGH_MULT', 1.4),
  },

  time: {
    urgentDays: parseIntEnv('PRICING_TIME_URGENT_DAYS', 1),
    soonDays: parseIntEnv('PRICING_TIME_SOON_DAYS', 3),
    nearDays: parseIntEnv('PRICING_TIME_NEAR_DAYS', 7),
    urgentMultiplier: parseFloatEnv('PRICING_TIME_URGENT_MULT', 1.15),
    soonMultiplier: parseFloatEnv('PRICING_TIME_SOON_MULT', 1.08),
    nearMultiplier: parseFloatEnv('PRICING_TIME_NEAR_MULT', 1.03),
    normalMultiplier: parseFloatEnv('PRICING_TIME_NORMAL_MULT', 1.0),
  },

  limits: {
    minMultiplier: parseFloatEnv('PRICING_MIN_MULT', 1.0),
    maxMultiplier: parseFloatEnv('PRICING_MAX_MULT', 2.0),
  },

  /** Promotional offer fares — always below regular (base) price */
  offer: {
    discountMultiplier: parseFloatEnv('PRICING_OFFER_DISCOUNT', 0.85),
    maxPercentOfBase: parseFloatEnv('PRICING_OFFER_MAX_BASE', 0.9),
    minDaysAhead: parseIntEnv('PRICING_OFFER_MIN_DAYS', 2),
    maxOccupancyPercent: parseIntEnv('PRICING_OFFER_MAX_OCCUPANCY', 75),
  },
};
