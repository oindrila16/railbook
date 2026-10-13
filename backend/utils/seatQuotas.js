const { FARE_CLASS_IDS, SEAT_QUOTA_PERCENT } = require('../config/fareClasses');
const ApiError = require('./ApiError');

function calculateSeatQuotas(value) {
  const total = Number(value);
  if (!Number.isSafeInteger(total) || total < FARE_CLASS_IDS.length) {
    throw ApiError.badRequest(`A train needs at least ${FARE_CLASS_IDS.length} seats, one for each fare class`);
  }
  let remaining = total;
  return FARE_CLASS_IDS.map((fareClass, index) => {
    const classesAfter = FARE_CLASS_IDS.length - index - 1;
    const quota = classesAfter === 0 ? remaining
      : Math.min(Math.max(1, Math.floor(total * SEAT_QUOTA_PERCENT[fareClass])), remaining - classesAfter);
    remaining -= quota;
    return { fareClass, seatQuota: quota };
  });
}
module.exports = { calculateSeatQuotas };
