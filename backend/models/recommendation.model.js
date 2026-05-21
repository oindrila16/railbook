/**
 * Recommendation data — booking history patterns and popular routes.
 */
const pool = require('../config/database');

/** User's confirmed booking patterns aggregated */
async function getUserBookingPatterns(userId) {
  const [rows] = await pool.query(
    `SELECT
       b.route_id,
       r.source_station_id,
       r.destination_station_id,
       src.code AS source_code,
       dest.code AS destination_code,
       t.train_class,
       t.id AS train_id,
       COUNT(*) AS trip_count,
       MAX(b.travel_date) AS last_travel_date
     FROM bookings b
     INNER JOIN routes r ON r.id = b.route_id
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE b.user_id = ? AND b.status = 'confirmed'
     GROUP BY b.route_id, r.source_station_id, r.destination_station_id,
              src.code, dest.code, t.train_class, t.id
     ORDER BY trip_count DESC, last_travel_date DESC`,
    [userId]
  );
  return rows;
}

/** Globally popular routes from view */
async function getPopularRoutes(limit = 10) {
  const [rows] = await pool.query(
    `SELECT
       v.route_id,
       v.booking_count,
       r.departure_time,
       r.arrival_time,
       r.duration_minutes,
       t.train_number,
       t.name AS train_name,
       t.train_class,
       t.base_price,
       t.total_seats,
       src.code AS source_code,
       src.name AS source_name,
       dest.code AS destination_code,
       dest.name AS destination_name
     FROM v_popular_routes v
     INNER JOIN routes r ON r.id = v.route_id AND r.is_active = 1
     INNER JOIN trains t ON t.id = r.train_id AND t.is_active = 1
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     ORDER BY v.booking_count DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

/** All active routes as recommendation candidates */
async function getActiveRoutes() {
  const [rows] = await pool.query(
    `SELECT
       r.id AS route_id,
       r.source_station_id,
       r.destination_station_id,
       r.departure_time,
       r.arrival_time,
       r.duration_minutes,
       r.distance_km,
       t.id AS train_id,
       t.train_number,
       t.name AS train_name,
       t.train_class,
       t.base_price,
       t.total_seats,
       src.code AS source_code,
       src.name AS source_name,
       dest.code AS destination_code,
       dest.name AS destination_name,
       COALESCE(v.booking_count, 0) AS booking_count
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id AND t.is_active = 1
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     LEFT JOIN v_popular_routes v ON v.route_id = r.id
     WHERE r.is_active = 1
     ORDER BY v.booking_count DESC, r.id ASC`
  );
  return rows;
}

/** Upcoming confirmed bookings to avoid duplicate suggestions */
async function getUpcomingBookedRouteIds(userId, fromDate) {
  const [rows] = await pool.query(
    `SELECT DISTINCT route_id
     FROM bookings
     WHERE user_id = ? AND status = 'confirmed' AND travel_date >= ?`,
    [userId, fromDate]
  );
  return rows.map((r) => r.route_id);
}

module.exports = {
  getUserBookingPatterns,
  getPopularRoutes,
  getActiveRoutes,
  getUpcomingBookedRouteIds,
};
