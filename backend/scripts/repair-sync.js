/**
 * One-time repair: align trains.base_price with route economy fares; fix existing seat numbers into class ranges.
 * Run: node scripts/repair-sync.js
 */
require('dotenv').config();
const pool = require('../config/database');
const routeFareModel = require('../models/routeFare.model');
const { FARE_CLASS_IDS } = require('../config/fareClasses');
const { getSeatRangeForClass, parseSeatNumber } = require('../utils/seatRange');

async function repairTrainPrices() {
  const [trains] = await pool.query('SELECT id FROM trains');
  for (const t of trains) {
    await routeFareModel.syncTrainBaseFromRoutes(t.id);
  }
}

/**
 * Remap legacy tickets that used overlapping S1…Sn per class into disjoint ranges.
 */
async function repairSeatNumbers() {
  const [routes] = await pool.query('SELECT id FROM routes');
  let remapped = 0;

  for (const { id: routeId } of routes) {
    const fares = await routeFareModel.findByRouteId(routeId);
    if (!fares.length) continue;

    for (const fareClass of FARE_CLASS_IDS) {
      const range = getSeatRangeForClass(fares, fareClass);
      const [tickets] = await pool.query(
        `SELECT tk.id, tk.seat_number
         FROM tickets tk
         INNER JOIN bookings b ON b.id = tk.booking_id
         WHERE tk.route_id = ?
           AND tk.fare_class = ?
           AND tk.status = 'active'
           AND b.status IN ('confirmed', 'pending')`,
        [routeId, fareClass]
      );

      const used = new Set();
      const [allInClass] = await pool.query(
        `SELECT seat_number FROM tickets tk
         INNER JOIN bookings b ON b.id = tk.booking_id
         WHERE tk.route_id = ? AND tk.fare_class = ? AND tk.status = 'active'
           AND b.status IN ('confirmed', 'pending')`,
        [routeId, fareClass]
      );
      allInClass.forEach((r) => used.add(String(r.seat_number).toUpperCase()));

      let next = range.minSeat;
      for (const ticket of tickets) {
        const num = parseSeatNumber(ticket.seat_number);
        const inRange = num != null && num >= range.minSeat && num <= range.maxSeat;
        if (inRange) continue;

        while (next <= range.maxSeat && used.has(`S${next}`)) next += 1;
        if (next > range.maxSeat) continue;

        const newSeat = `S${next}`;
        used.add(newSeat);
        await pool.query('UPDATE tickets SET seat_number = ? WHERE id = ?', [
          newSeat,
          ticket.id,
        ]);
        remapped += 1;
        next += 1;
      }
    }
  }

  return remapped;
}

async function main() {
  await repairTrainPrices();
  const remapped = await repairSeatNumbers();
  console.log(JSON.stringify({ ok: true, remappedTickets: remapped }, null, 2));
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
