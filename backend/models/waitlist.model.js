/**
 * Waitlist data access layer.
 */
const pool = require('../config/database');

async function findByUserRouteDate(connection, userId, routeId, travelDate) {
  const [rows] = await connection.query(
    `SELECT * FROM waitlist
     WHERE user_id = ? AND route_id = ? AND travel_date = ? AND status = 'waiting'
     LIMIT 1`,
    [userId, routeId, travelDate]
  );
  return rows[0] || null;
}

async function findById(waitlistId) {
  const [rows] = await pool.query('SELECT * FROM waitlist WHERE id = ?', [waitlistId]);
  return rows[0] || null;
}

async function findByIdForUpdate(connection, waitlistId) {
  const [rows] = await connection.query(
    'SELECT * FROM waitlist WHERE id = ? FOR UPDATE',
    [waitlistId]
  );
  return rows[0] || null;
}

async function getNextPosition(connection, routeId, travelDate) {
  const [rows] = await connection.query(
    `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
     FROM waitlist
     WHERE route_id = ? AND travel_date = ? AND status = 'waiting'`,
    [routeId, travelDate]
  );
  return rows[0].next_position;
}

async function create(connection, data) {
  const [result] = await connection.query(
    `INSERT INTO waitlist
     (user_id, route_id, travel_date, position, passenger_count, passengers_json, status)
     VALUES (?, ?, ?, ?, ?, ?, 'waiting')`,
    [
      data.userId,
      data.routeId,
      data.travelDate,
      data.position,
      data.passengerCount,
      JSON.stringify(data.passengers),
    ]
  );
  return result.insertId;
}

async function getNextWaitingForUpdate(connection, routeId, travelDate) {
  const [rows] = await connection.query(
    `SELECT * FROM waitlist
     WHERE route_id = ? AND travel_date = ? AND status = 'waiting'
     ORDER BY position ASC
     LIMIT 1
     FOR UPDATE`,
    [routeId, travelDate]
  );
  return rows[0] || null;
}

async function updateStatus(connection, waitlistId, status, bookingId = null) {
  await connection.query(
    `UPDATE waitlist
     SET status = ?, booking_id = ?, notified_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [status, bookingId, waitlistId]
  );
}

/** Shift queue positions down after a promotion (FIFO maintenance) */
async function rebalancePositionsAfter(connection, routeId, travelDate, removedPosition) {
  await connection.query(
    `UPDATE waitlist
     SET position = position - 1, updated_at = NOW()
     WHERE route_id = ? AND travel_date = ? AND status = 'waiting' AND position > ?`,
    [routeId, travelDate, removedPosition]
  );
}

async function countWaiting(routeId, travelDate, conn = pool) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total FROM waitlist
     WHERE route_id = ? AND travel_date = ? AND status = 'waiting'`,
    [routeId, travelDate]
  );
  return rows[0].total;
}

async function countAhead(routeId, travelDate, position, conn = pool) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS ahead FROM waitlist
     WHERE route_id = ? AND travel_date = ? AND status = 'waiting' AND position < ?`,
    [routeId, travelDate, position]
  );
  return rows[0].ahead;
}

async function findByUserId(userId, { routeId, travelDate } = {}) {
  let sql = `
    SELECT w.*,
       t.train_number, t.name AS train_name, t.train_class,
       src.code AS source_code, src.name AS source_name,
       dest.code AS destination_code, dest.name AS destination_name,
       b.booking_reference
     FROM waitlist w
     INNER JOIN routes r ON r.id = w.route_id
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     LEFT JOIN bookings b ON b.id = w.booking_id
     WHERE w.user_id = ?`;
  const params = [userId];

  if (routeId) {
    sql += ' AND w.route_id = ?';
    params.push(routeId);
  }
  if (travelDate) {
    sql += ' AND w.travel_date = ?';
    params.push(travelDate);
  }

  sql += ' ORDER BY w.travel_date DESC, w.position ASC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function getQueueForRouteDate(routeId, travelDate) {
  const [rows] = await pool.query(
    `SELECT w.id, w.user_id, w.position, w.passenger_count, w.status, w.created_at
     FROM waitlist w
     WHERE w.route_id = ? AND w.travel_date = ? AND w.status = 'waiting'
     ORDER BY w.position ASC`,
    [routeId, travelDate]
  );
  return rows;
}

module.exports = {
  findByUserRouteDate,
  findById,
  findByIdForUpdate,
  getNextPosition,
  create,
  getNextWaitingForUpdate,
  updateStatus,
  rebalancePositionsAfter,
  countWaiting,
  countAhead,
  findByUserId,
  getQueueForRouteDate,
};
