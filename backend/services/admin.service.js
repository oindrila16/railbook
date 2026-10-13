/**
 * Admin dashboard — stats, users, bookings, trains.
 */
const pool = require('../config/database');
const { calculateSeatQuotas } = require('../utils/seatQuotas');
const { getTodayISO } = require('../utils/dates');
const ApiError = require('../utils/ApiError');
const userModel = require('../models/user.model');
const bookingModel = require('../models/booking.model');
const routeFareModel = require('../models/routeFare.model');
const { FARE_CLASS_IDS, BASE_PRICE_MULTIPLIER, getFareClassLabel } = require('../config/fareClasses');
const {
  computeDurationMinutes,
  formatDurationLabel,
} = require('../utils/schedule');

async function getDashboardStats() {
  const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[bookings]] = await pool.query(
    "SELECT COUNT(*) AS total FROM bookings WHERE status = 'confirmed'"
  );
  const [[revenue]] = await pool.query(
    "SELECT COALESCE(SUM(total_amount), 0) AS total FROM bookings WHERE status = 'confirmed'"
  );
  const [[trains]] = await pool.query('SELECT COUNT(*) AS total FROM trains WHERE is_active = 1');
  const [[routes]] = await pool.query('SELECT COUNT(*) AS total FROM routes WHERE is_active = 1');

  return {
    users: Number(users.total),
    confirmedBookings: Number(bookings.total),
    revenueBDT: Number(revenue.total),
    activeTrains: Number(trains.total),
    activeRoutes: Number(routes.total),
  };
}

async function listUsers(limit = 100) {
  const rows = await userModel.listAll(limit);
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    fullName: u.full_name,
    role: u.role || 'user',
    isVerified: Boolean(u.is_verified),
    isActive: Boolean(u.is_active),
    createdAt: u.created_at,
  }));
}

async function listBookings(limit = 50) {
  const rows = await bookingModel.findAll(limit);
  return rows.map((b) => ({
    id: b.id,
    bookingReference: b.booking_reference,
    userEmail: b.user_email,
    userName: b.user_name,
    trainName: b.train_name,
    trainNumber: b.train_number,
    route: `${b.source_code} → ${b.destination_code}`,
    travelDate: b.travel_date,
    status: b.status,
    totalAmount: Number(b.total_amount),
    seatCount: b.seat_count,
    fareClass: b.fare_class,
    createdAt: b.created_at,
  }));
}

function buildFarePreview(economyBase) {
  const base = Number(economyBase);
  return FARE_CLASS_IDS.map((fareClass) => ({
    fareClass,
    label: getFareClassLabel(fareClass),
    basePrice: Math.round(base * BASE_PRICE_MULTIPLIER[fareClass]),
  }));
}

async function listTrains() {
  const [rows] = await pool.query(
    `SELECT
       t.id,
       t.train_number,
       t.name,
       t.total_seats,
       t.base_price,
       t.train_class,
       t.is_active,
       t.created_at,
       MIN(rf_e.base_price) AS min_economy_fare,
       MAX(rf_e.base_price) AS max_economy_fare
     FROM trains t
     LEFT JOIN routes r ON r.train_id = t.id
     LEFT JOIN route_fares rf_e ON rf_e.route_id = r.id AND rf_e.fare_class = 'economy'
     GROUP BY t.id, t.train_number, t.name, t.total_seats, t.base_price, t.train_class, t.is_active, t.created_at
     ORDER BY t.train_number`
  );
  return rows.map((t) => {
    const minFare = t.min_economy_fare != null ? Number(t.min_economy_fare) : Number(t.base_price);
    const maxFare = t.max_economy_fare != null ? Number(t.max_economy_fare) : minFare;
    const displayBase = minFare;
    return {
      id: t.id,
      number: t.train_number,
      name: t.name,
      totalSeats: t.total_seats,
      basePrice: displayBase,
      economyPriceRange:
        minFare !== maxFare ? { min: minFare, max: maxFare } : null,
      fares: buildFarePreview(displayBase),
      trainClass: t.train_class,
      isActive: Boolean(t.is_active),
      createdAt: t.created_at,
    };
  });
}

async function updateTrain(trainId, { basePrice, isActive, totalSeats }) {
  if (totalSeats !== undefined) calculateSeatQuotas(totalSeats);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Match booking's route-first lock order so reservations cannot race resizing.
    await connection.query('SELECT id FROM routes WHERE train_id = ? ORDER BY id FOR UPDATE', [trainId]);
    const [existing] = await connection.query('SELECT * FROM trains WHERE id = ? FOR UPDATE', [trainId]);
    if (!existing.length) throw ApiError.notFound('Train not found');
    const capacityChanged = totalSeats !== undefined && Number(totalSeats) !== Number(existing[0].total_seats);
    if (capacityChanged) {
      const [reservations] = await connection.query(
        `SELECT b.id FROM bookings b JOIN routes r ON r.id = b.route_id
         WHERE r.train_id = ? AND b.travel_date >= ? AND b.status IN ('confirmed', 'pending') LIMIT 1`,
        [trainId, getTodayISO()]
      );
      const [waiting] = await connection.query(
        `SELECT w.id FROM waitlist w JOIN routes r ON r.id = w.route_id
         WHERE r.train_id = ? AND w.travel_date >= ? AND w.status = 'waiting' LIMIT 1`,
        [trainId, getTodayISO()]
      );
      if (reservations.length || waiting.length) {
        throw ApiError.conflict('Capacity cannot change while this train has current or future bookings or waiting passengers');
      }
    }
    const updates = [], params = [];
    if (basePrice !== undefined) { updates.push('base_price = ?'); params.push(Number(basePrice)); }
    if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (totalSeats !== undefined) { updates.push('total_seats = ?'); params.push(Number(totalSeats)); }
    if (!updates.length) throw ApiError.badRequest('No fields to update');
    await connection.query(`UPDATE trains SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, [...params, trainId]);
    if (isActive !== undefined) {
      await connection.query('UPDATE routes SET is_active = ?, updated_at = NOW() WHERE train_id = ?', [isActive ? 1 : 0, trainId]);
    }
    const fareSync = basePrice !== undefined
      ? await routeFareModel.syncBasePricesForTrain(trainId, basePrice, connection) : null;
    const quotaSync = capacityChanged
      ? await routeFareModel.syncSeatQuotasForTrain(trainId, totalSeats, connection) : null;
    const [rows] = await connection.query('SELECT * FROM trains WHERE id = ?', [trainId]);
    await connection.commit();
    const t = rows[0];
    return {
      id: t.id, number: t.train_number, name: t.name, totalSeats: t.total_seats,
      basePrice: Number(t.base_price), fares: buildFarePreview(t.base_price),
      trainClass: t.train_class, isActive: Boolean(t.is_active), fareSync, quotaSync,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function listRoutes() {
  const [rows] = await pool.query(
    `SELECT
       r.id AS route_id,
       r.departure_time,
       r.arrival_time,
       r.duration_minutes,
       r.is_active AS route_active,
       t.id AS train_id,
       t.train_number,
       t.name AS train_name,
       t.base_price AS train_base_price,
       src.code AS source_code,
       src.name AS source_name,
       dest.code AS destination_code,
       dest.name AS destination_name,
       rf_economy.base_price AS economy_price
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     LEFT JOIN route_fares rf_economy ON rf_economy.route_id = r.id AND rf_economy.fare_class = 'economy'
     ORDER BY t.train_number, src.code, dest.code`
  );

  return rows.map((row) => ({
    routeId: row.route_id,
    train: {
      id: row.train_id,
      number: row.train_number,
      name: row.train_name,
    },
    route: {
      source: row.source_code,
      sourceName: row.source_name,
      destination: row.destination_code,
      destinationName: row.destination_name,
    },
    schedule: {
      departureTime: String(row.departure_time).slice(0, 5),
      arrivalTime: String(row.arrival_time).slice(0, 5),
      durationMinutes: row.duration_minutes,
      durationLabel: formatDurationLabel(row.duration_minutes),
    },
    economyPrice: Number(row.economy_price ?? row.train_base_price),
    fares: buildFarePreview(row.economy_price ?? row.train_base_price),
    isActive: Boolean(row.route_active),
  }));
}

async function updateRoute(routeId, payload) {
  const [existing] = await pool.query(
    `SELECT r.id, r.train_id, r.departure_time, r.arrival_time
     FROM routes r WHERE r.id = ?`,
    [routeId]
  );
  if (!existing.length) throw ApiError.notFound('Route not found');

  const row = existing[0];
  const updates = [];
  const params = [];

  let departure = payload.departureTime ?? String(row.departure_time).slice(0, 5);
  let arrival = payload.arrivalTime ?? String(row.arrival_time).slice(0, 5);

  if (payload.departureTime !== undefined) {
    updates.push('departure_time = ?');
    params.push(`${departure}:00`);
  }
  if (payload.arrivalTime !== undefined) {
    updates.push('arrival_time = ?');
    params.push(`${arrival}:00`);
  }
  if (payload.departureTime !== undefined || payload.arrivalTime !== undefined) {
    const duration = computeDurationMinutes(departure, arrival);
    updates.push('duration_minutes = ?');
    params.push(duration);
  }
  if (payload.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(payload.isActive ? 1 : 0);
  }

  if (updates.length) {
    params.push(routeId);
    await pool.query(`UPDATE routes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, params);
  }

  let fareSync = null;
  if (payload.economyPrice !== undefined) {
    fareSync = await routeFareModel.syncBasePricesForRoute(routeId, payload.economyPrice);
  }

  const routes = await listRoutes();
  const updated = routes.find((r) => r.routeId === routeId);

  return { route: updated, fareSync };
}

module.exports = {
  getDashboardStats,
  listUsers,
  listBookings,
  listTrains,
  updateTrain,
  listRoutes,
  updateRoute,
};
