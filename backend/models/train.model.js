/**
 * Train and route search queries.
 */
const pool = require('../config/database');

/**
 * Search active routes by station codes and travel date.
 * Seat availability is computed dynamically from active tickets.
 */
async function searchRoutes({ sourceStationId, destinationStationId, travelDate }) {
  const [rows] = await pool.query(
    `SELECT
       r.id AS route_id,
       r.departure_time,
       r.arrival_time,
       r.duration_minutes,
       r.distance_km,
       t.id AS train_id,
       t.train_number,
       t.name AS train_name,
       t.total_seats,
       t.base_price,
       t.train_class,
       src.id AS source_station_id,
       src.name AS source_station_name,
       src.code AS source_station_code,
       src.city AS source_city,
       dest.id AS destination_station_id,
       dest.name AS destination_station_name,
       dest.code AS destination_station_code,
       dest.city AS destination_city,
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
     WHERE r.source_station_id = ?
       AND r.destination_station_id = ?
       AND r.is_active = 1
     ORDER BY r.departure_time ASC`,
    [travelDate, travelDate, sourceStationId, destinationStationId]
  );
  return rows;
}

module.exports = { searchRoutes };
