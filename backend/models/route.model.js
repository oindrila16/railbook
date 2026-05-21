/**
 * Route data access — includes row locking for transactional booking.
 */
const pool = require('../config/database');

/** Lock route + train row inside an open transaction */
async function findByIdForUpdate(connection, routeId) {
  const [rows] = await connection.query(
    `SELECT
       r.id AS route_id,
       r.train_id,
       r.source_station_id,
       r.destination_station_id,
       r.departure_time,
       r.arrival_time,
       r.is_active AS route_active,
       t.train_number,
       t.name AS train_name,
       t.total_seats,
       t.base_price,
       t.train_class,
       t.is_active AS train_active,
       src.code AS source_code,
       src.name AS source_name,
       dest.code AS destination_code,
       dest.name AS destination_name
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE r.id = ?
     FOR UPDATE`,
    [routeId]
  );
  return rows[0] || null;
}

async function findById(routeId) {
  const [rows] = await pool.query(
    `SELECT
       r.id AS route_id,
       r.departure_time,
       r.arrival_time,
       r.is_active AS route_active,
       t.train_number,
       t.name AS train_name,
       t.total_seats,
       t.base_price,
       t.train_class,
       t.is_active AS train_active,
       src.code AS source_code,
       src.name AS source_name,
       dest.code AS destination_code,
       dest.name AS destination_name
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE r.id = ?`,
    [routeId]
  );
  return rows[0] || null;
}

module.exports = { findByIdForUpdate, findById };
