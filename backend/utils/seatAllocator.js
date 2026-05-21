const {
  filterBookedInRange,
  isValidSeatInRange,
} = require('./seatRange');

/**
 * Assign lowest available seat numbers within [minSeat, maxSeat].
 */
function allocateSeats(minSeat, maxSeat, bookedSeatNumbers, count) {
  const booked = new Set(bookedSeatNumbers.map((s) => s.toUpperCase()));
  const allocated = [];

  for (let num = minSeat; num <= maxSeat && allocated.length < count; num += 1) {
    const seat = `S${num}`;
    if (!booked.has(seat)) {
      allocated.push(seat);
    }
  }

  return allocated.length === count ? allocated : null;
}

/**
 * Use passenger-provided seats or fall back to automatic allocation within class range.
 * @param {{ minSeat: number, maxSeat: number, quota: number }} seatRange
 */
function resolveSeatAssignment(passengers, seatRange, bookedSeatNumbers) {
  const { minSeat, maxSeat } = seatRange;
  const bookedInRange = filterBookedInRange(bookedSeatNumbers, minSeat, maxSeat);
  const booked = new Set(bookedInRange.map((s) => s.toUpperCase()));
  const requested = passengers.map((p) =>
    p.seatNumber ? String(p.seatNumber).trim().toUpperCase() : null
  );
  const hasAny = requested.some(Boolean);
  const hasAll = requested.every(Boolean);

  if (hasAny && !hasAll) {
    return {
      ok: false,
      error: 'Select a seat for every passenger, or leave all seats unselected for auto-assign',
    };
  }

  if (hasAll) {
    const unique = new Set(requested);
    if (unique.size !== requested.length) {
      return { ok: false, error: 'Each passenger must have a different seat' };
    }

    for (const seat of requested) {
      if (!isValidSeatInRange(seat, minSeat, maxSeat)) {
        return { ok: false, error: `Seat ${seat} is not valid for this fare class` };
      }
      if (booked.has(seat)) {
        return { ok: false, error: `Seat ${seat} is already booked` };
      }
    }

    return { ok: true, seats: requested };
  }

  const auto = allocateSeats(minSeat, maxSeat, bookedInRange, passengers.length);
  if (!auto) {
    return { ok: false, error: 'full' };
  }
  return { ok: true, seats: auto };
}

module.exports = { allocateSeats, resolveSeatAssignment };
