/**
 * Audit: train base_price vs route_fares, route data integrity.
 * Run: npm run audit
 */
require('dotenv').config();
const pool = require('../config/database');
const { BASE_PRICE_MULTIPLIER } = require('../config/fareClasses');

async function audit() {
  const issues = [];

  const [drift] = await pool.query(
    `SELECT t.train_number, t.base_price AS train_base, rf.base_price AS fare_base
     FROM trains t
     INNER JOIN routes r ON r.train_id = t.id
     INNER JOIN route_fares rf ON rf.route_id = r.id AND rf.fare_class = 'economy'
     WHERE ABS(t.base_price - rf.base_price) > 0.01`
  );
  if (drift.length) {
    issues.push({
      type: 'PRICE_DRIFT',
      count: drift.length,
      sample: drift.slice(0, 3).map((d) => ({
        train: d.train_number,
        trainBase: Number(d.train_base),
        routeFare: Number(d.fare_base),
      })),
    });
  }

  const [missingFares] = await pool.query(
    `SELECT r.id AS route_id, t.train_number
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id
     LEFT JOIN route_fares rf ON rf.route_id = r.id
     WHERE rf.id IS NULL`
  );
  if (missingFares.length) {
    issues.push({ type: 'MISSING_ROUTE_FARES', count: missingFares.length });
  }

  const [econRows] = await pool.query(
    `SELECT r.id AS route_id, rf.fare_class, rf.base_price
     FROM routes r
     JOIN route_fares rf ON rf.route_id = r.id`
  );
  let multErrors = 0;
  const byRoute = {};
  for (const row of econRows) {
    if (!byRoute[row.route_id]) byRoute[row.route_id] = {};
    byRoute[row.route_id][row.fare_class] = Number(row.base_price);
  }
  for (const fares of Object.values(byRoute)) {
    const econ = fares.economy;
    if (econ == null) continue;
    for (const fc of ['business', 'first']) {
      if (fares[fc] == null) continue;
      const exp = Math.round(econ * BASE_PRICE_MULTIPLIER[fc]);
      if (Math.abs(exp - fares[fc]) > 1) multErrors += 1;
    }
  }
  if (multErrors) {
    issues.push({ type: 'FARE_CLASS_MULTIPLIER_MISMATCH', count: multErrors });
  }

  const [quotaRows] = await pool.query(
    `SELECT r.id AS route_id, t.train_number, t.total_seats,
            SUM(rf.seat_quota) AS quota_sum
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id
     INNER JOIN route_fares rf ON rf.route_id = r.id
     GROUP BY r.id, t.train_number, t.total_seats
     HAVING quota_sum != t.total_seats`
  );
  if (quotaRows.length) {
    issues.push({
      type: 'SEAT_QUOTA_SUM_MISMATCH',
      count: quotaRows.length,
      sample: quotaRows.slice(0, 3).map((r) => ({
        train: r.train_number,
        totalSeats: Number(r.total_seats),
        quotaSum: Number(r.quota_sum),
      })),
    });
  }

  const [[counts]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM stations) AS stations,
       (SELECT COUNT(*) FROM trains) AS trains,
       (SELECT COUNT(*) FROM routes) AS routes,
       (SELECT COUNT(*) FROM route_fares) AS fares,
       (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins`
  );

  console.log(JSON.stringify({ ok: issues.length === 0, issues, counts }, null, 2));
  await pool.end();
  process.exit(issues.length ? 1 : 0);
}

audit().catch((e) => {
  console.error(e);
  process.exit(1);
});
