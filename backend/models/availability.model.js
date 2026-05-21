/**
 * Live seat availability queries per route + travel date.
 */
const pool = require('../config/database');

async function getRouteAvailability(routeId, travelDate) {
  const [rows] = await pool.query(
    `SELECT
       r.id AS route_id,
       r.departure_time,
       r.arrival_time,
       t.id AS train_id,
       t.train_number,
       t.name AS train_name,
       t.total_seats,
       t.base_price,
       t.train_class,
       src.code AS source_code,
       src.name AS source_name,
       dest.code AS destination_code,
       dest.name AS destination_name,
       COALESCE(seat_stats.booked_seats, 0) AS booked_seats,
       COALESCE(waitlist_stats.waitlist_count, 0) AS waitlist_count
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id AND t.is_active = 1
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
     LEFT JOIN (
       SELECT route_id, COUNT(*) AS waitlist_count
       FROM waitlist
       WHERE travel_date = ? AND status = 'waiting'
       GROUP BY route_id
     ) waitlist_stats ON waitlist_stats.route_id = r.id
     WHERE r.id = ? AND r.is_active = 1`,
    [travelDate, travelDate, routeId]
  );
  return rows[0] || null;
}

module.exports = { getRouteAvailability };
