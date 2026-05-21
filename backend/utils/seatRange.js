/**
 * Per-fare-class seat ID ranges on a route (S1…Sn blocks do not overlap between classes).
 */
const { FARE_CLASS_IDS, normalizeFareClass } = require('../config/fareClasses');

function parseSeatNumber(seatId) {
  const match = /^S(\d+)$/i.exec(String(seatId || '').trim());
  return match ? parseInt(match[1], 10) : null;
}

/**
 * @param {Array<{ fare_class: string, seat_quota: number }>} routeFares
 */
function getSeatRangeForClass(routeFares, fareClassInput) {
  const fareClass = normalizeFareClass(fareClassInput) || 'economy';
  let offset = 0;
  let quota = 0;

  for (const fc of FARE_CLASS_IDS) {
    const row = routeFares.find((f) => f.fare_class === fc);
    const q = row ? Number(row.seat_quota) : 0;
    if (fc === fareClass) {
      quota = Math.max(0, q);
      break;
    }
    offset += Math.max(0, q);
  }

  if (!quota) {
    const econ = routeFares.find((f) => f.fare_class === 'economy');
    quota = econ ? Number(econ.seat_quota) : 0;
    offset = 0;
  }

  return {
    fareClass,
    offset,
    quota,
    minSeat: offset + 1,
    maxSeat: offset + quota,
  };
}

function filterBookedInRange(bookedSeatNumbers, minSeat, maxSeat) {
  return bookedSeatNumbers.filter((s) => {
    const n = parseSeatNumber(s);
    return n != null && n >= minSeat && n <= maxSeat;
  });
}

function isValidSeatInRange(seatId, minSeat, maxSeat) {
  const n = parseSeatNumber(seatId);
  return n != null && n >= minSeat && n <= maxSeat;
}

module.exports = {
  parseSeatNumber,
  getSeatRangeForClass,
  filterBookedInRange,
  isValidSeatInRange,
};
