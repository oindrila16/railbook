/**
 * Per-route fare class pricing (Economy, Business, First).
 */
const pool = require('../config/database');
const { calculateSeatQuotas } = require('../utils/seatQuotas');
const {
  FARE_CLASS_IDS,
  BASE_PRICE_MULTIPLIER,
} = require('../config/fareClasses');

async function findByRouteId(routeId, connection = pool) {
  const [rows] = await connection.query(
    `SELECT id, route_id, fare_class, base_price, seat_quota
     FROM route_fares
     WHERE route_id = ?
     ORDER BY FIELD(fare_class, 'economy', 'business', 'first')`,
    [routeId]
  );
  return rows;
}

async function findByRouteIds(routeIds) {
  if (!routeIds.length) return [];
  const [rows] = await pool.query(
    `SELECT id, route_id, fare_class, base_price, seat_quota
     FROM route_fares
     WHERE route_id IN (?)
     ORDER BY route_id, FIELD(fare_class, 'economy', 'business', 'first')`,
    [routeIds]
  );
  return rows;
}

async function findByRouteAndClass(routeId, fareClass) {
  const [rows] = await pool.query(
    `SELECT id, route_id, fare_class, base_price, seat_quota
     FROM route_fares
     WHERE route_id = ? AND fare_class = ?`,
    [routeId, fareClass]
  );
  return rows[0] || null;
}

async function countBookedByClassForRoutes(routeIds, travelDate) {
  if (!routeIds.length) return [];
  const [rows] = await pool.query(
    `SELECT tk.route_id, tk.fare_class, COUNT(*) AS booked_count
     FROM tickets tk
     INNER JOIN bookings b ON b.id = tk.booking_id
     WHERE tk.route_id IN (?)
       AND tk.travel_date = ?
       AND tk.status = 'active'
       AND b.status IN ('confirmed', 'pending')
     GROUP BY tk.route_id, tk.fare_class`,
    [routeIds, travelDate]
  );
  return rows;
}

async function countBookedByClass(routeId, travelDate, fareClass) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS booked_count
     FROM tickets tk
     INNER JOIN bookings b ON b.id = tk.booking_id
     WHERE tk.route_id = ?
       AND tk.travel_date = ?
       AND tk.fare_class = ?
       AND tk.status = 'active'
       AND b.status IN ('confirmed', 'pending')`,
    [routeId, travelDate, fareClass]
  );
  return Number(rows[0]?.booked_count ?? 0);
}

async function countBookedByClassForUpdate(connection, routeId, travelDate, fareClass) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS booked_count
     FROM tickets tk
     INNER JOIN bookings b ON b.id = tk.booking_id
     WHERE tk.route_id = ?
       AND tk.travel_date = ?
       AND tk.fare_class = ?
       AND tk.status = 'active'
       AND b.status IN ('confirmed', 'pending')
     FOR UPDATE`,
    [routeId, travelDate, fareClass]
  );
  return Number(rows[0]?.booked_count ?? 0);
}

/**
 * Sync route_fares.base_price for every route on a train (user-facing prices).
 */
async function syncBasePricesForTrain(trainId, economyBasePrice, connection = pool) {
  const base = Math.max(0, Number(economyBasePrice));
  const [routes] = await connection.query(
    'SELECT id FROM routes WHERE train_id = ?',
    [trainId]
  );

  if (!routes.length) return { routesUpdated: 0, faresUpdated: 0 };

  let faresUpdated = 0;

  for (const route of routes) {
    for (const fareClass of FARE_CLASS_IDS) {
      const price = Math.round(base * BASE_PRICE_MULTIPLIER[fareClass]);
      const [result] = await connection.query(
        `UPDATE route_fares
         SET base_price = ?
         WHERE route_id = ? AND fare_class = ?`,
        [price, route.id, fareClass]
      );
      faresUpdated += result.affectedRows || 0;
    }
  }

  return { routesUpdated: routes.length, faresUpdated };
}

/** Sync fare classes for a single route (per-route price override). */
async function syncBasePricesForRoute(routeId, economyBasePrice) {
  const base = Math.max(0, Number(economyBasePrice));
  let faresUpdated = 0;

  for (const fareClass of FARE_CLASS_IDS) {
    const price = Math.round(base * BASE_PRICE_MULTIPLIER[fareClass]);
    const [result] = await pool.query(
      `UPDATE route_fares SET base_price = ? WHERE route_id = ? AND fare_class = ?`,
      [price, routeId, fareClass]
    );
    faresUpdated += result.affectedRows || 0;
  }

  const [[routeRow]] = await pool.query('SELECT train_id FROM routes WHERE id = ?', [routeId]);
  const trainSync = routeRow
    ? await syncTrainBaseFromRoutes(routeRow.train_id)
    : { updated: false };

  return { faresUpdated, trainSync };
}

/** Recalculate seat_quota for every route on a train after total_seats changes. */
async function syncSeatQuotasForTrain(trainId, totalSeats, connection = pool) {
  const quotas = calculateSeatQuotas(totalSeats);
  const [routes] = await connection.query('SELECT id FROM routes WHERE train_id = ?', [trainId]);
  let faresUpdated = 0;
  for (const route of routes) {
    for (const { fareClass, seatQuota } of quotas) {
      const [result] = await connection.query(
        'UPDATE route_fares SET seat_quota = ? WHERE route_id = ? AND fare_class = ?',
        [seatQuota, route.id, fareClass]
      );
      faresUpdated += result.affectedRows || 0;
    }
  }
  return { routesUpdated: routes.length, faresUpdated };
}

/** Align trains.base_price with the lowest economy fare on this train's routes. */
async function syncTrainBaseFromRoutes(trainId) {
  const [rows] = await pool.query(
    `SELECT MIN(rf.base_price) AS min_economy
     FROM route_fares rf
     INNER JOIN routes r ON r.id = rf.route_id
     WHERE r.train_id = ? AND rf.fare_class = 'economy'`,
    [trainId]
  );
  const minEconomy = rows[0]?.min_economy;
  if (minEconomy == null) return { updated: false };

  await pool.query('UPDATE trains SET base_price = ?, updated_at = NOW() WHERE id = ?', [
    Number(minEconomy),
    trainId,
  ]);
  return { updated: true, basePrice: Number(minEconomy) };
}

async function insertMany(connection, fares) {
  if (!fares.length) return;
  const values = fares.map((f) => [f.routeId, f.fareClass, f.basePrice, f.seatQuota]);
  await connection.query(
    `INSERT INTO route_fares (route_id, fare_class, base_price, seat_quota) VALUES ?`,
    [values]
  );
}

module.exports = {
  findByRouteId,
  findByRouteIds,
  findByRouteAndClass,
  countBookedByClass,
  countBookedByClassForRoutes,
  countBookedByClassForUpdate,
  syncBasePricesForTrain,
  syncBasePricesForRoute,
  syncSeatQuotasForTrain,
  syncTrainBaseFromRoutes,
  insertMany,
};
