/**
 * Booking data access layer.
 */
const pool = require('../config/database');

async function create(connection, data) {
  const [result] = await connection.query(
    `INSERT INTO bookings
     (booking_reference, user_id, route_id, travel_date, status, total_amount, seat_count,
      fare_class, base_price_snapshot, final_price_snapshot, pricing_factor, pricing_breakdown)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.bookingReference,
      data.userId,
      data.routeId,
      data.travelDate,
      data.status,
      data.totalAmount,
      data.seatCount,
      data.fareClass || 'economy',
      data.basePriceSnapshot,
      data.finalPriceSnapshot,
      data.pricingFactor,
      data.pricingBreakdown ? JSON.stringify(data.pricingBreakdown) : null,
    ]
  );
  return result.insertId;
}

async function findById(bookingId, connection = pool) {
  const [rows] = await connection.query(
    `SELECT b.*,
       t.train_number, t.name AS train_name, t.train_class,
       src.code AS source_code, src.name AS source_name,
       dest.code AS destination_code, dest.name AS destination_name
     FROM bookings b
     INNER JOIN routes r ON r.id = b.route_id
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE b.id = ?`,
    [bookingId]
  );
  return rows[0] || null;
}

async function findByIdForUpdate(connection, bookingId) {
  const [rows] = await connection.query(
    'SELECT * FROM bookings WHERE id = ? FOR UPDATE',
    [bookingId]
  );
  return rows[0] || null;
}

async function findByReference(reference) {
  const [rows] = await pool.query(
    `SELECT b.*,
       t.train_number, t.name AS train_name, t.train_class,
       r.departure_time, r.arrival_time, r.duration_minutes,
       src.code AS source_code, src.name AS source_name,
       dest.code AS destination_code, dest.name AS destination_name
     FROM bookings b
     INNER JOIN routes r ON r.id = b.route_id
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE UPPER(b.booking_reference) = UPPER(?)
     LIMIT 1`,
    [reference.trim()]
  );
  return rows[0] || null;
}

async function findAll(limit = 50) {
  const [rows] = await pool.query(
    `SELECT b.*,
       u.email AS user_email, u.full_name AS user_name,
       t.train_number, t.name AS train_name,
       src.code AS source_code, dest.code AS destination_code
     FROM bookings b
     INNER JOIN users u ON u.id = b.user_id
     INNER JOIN routes r ON r.id = b.route_id
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     ORDER BY b.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT b.*,
       t.train_number, t.name AS train_name, t.train_class,
       src.code AS source_code, src.name AS source_name,
       dest.code AS destination_code, dest.name AS destination_name
     FROM bookings b
     INNER JOIN routes r ON r.id = b.route_id
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE b.user_id = ?
     ORDER BY b.travel_date DESC, b.created_at DESC`,
    [userId]
  );
  return rows;
}

async function updateStatus(connection, bookingId, status) {
  const cancelledAt = status === 'cancelled' ? new Date() : null;
  await connection.query(
    `UPDATE bookings
     SET status = ?, cancelled_at = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, cancelledAt, bookingId]
  );
}

module.exports = {
  create,
  findById,
  findByIdForUpdate,
  findByReference,
  findAll,
  findByUserId,
  updateStatus,
};
