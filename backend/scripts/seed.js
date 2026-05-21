/**
 * Seed Bangladesh Railway stations, trains, and routes.
 * Safe to re-run: clears route-related data and re-inserts.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const userModel = require('../models/user.model');
const {
  FARE_CLASS_IDS,
  SEAT_QUOTA_PERCENT,
  BASE_PRICE_MULTIPLIER,
} = require('../config/fareClasses');

const STATIONS = [
  { name: 'Kamalapur', code: 'DHK', city: 'Dhaka', state: 'Dhaka' },
  { name: 'Chattogram', code: 'CTG', city: 'Chattogram', state: 'Chattogram' },
  { name: 'Sylhet', code: 'SYL', city: 'Sylhet', state: 'Sylhet' },
  { name: 'Rajshahi', code: 'RJSH', city: 'Rajshahi', state: 'Rajshahi' },
  { name: 'Khulna', code: 'KHL', city: 'Khulna', state: 'Khulna' },
  { name: 'Rangpur', code: 'RGP', city: 'Rangpur', state: 'Rangpur' },
  { name: 'Bogura', code: 'BOG', city: 'Bogura', state: 'Rajshahi' },
  { name: 'Cumilla', code: 'COM', city: 'Cumilla', state: 'Chattogram' },
  { name: 'Jessore', code: 'JSS', city: 'Jessore', state: 'Khulna' },
  { name: 'Mymensingh', code: 'MYM', city: 'Mymensingh', state: 'Mymensingh' },
  { name: 'Dinajpur', code: 'DIN', city: 'Dinajpur', state: 'Rangpur' },
  { name: 'Tangail', code: 'TGL', city: 'Tangail', state: 'Dhaka' },
];

const TRAINS = [
  { train_number: '701', name: 'Suborno Express', total_seats: 500, base_price: 1150, train_class: 'AC' },
  { train_number: '702', name: 'Suborno Express', total_seats: 500, base_price: 1150, train_class: 'AC' },
  { train_number: '705', name: 'Mohanagar Godhuli', total_seats: 480, base_price: 920, train_class: 'AC' },
  { train_number: '706', name: 'Mohanagar Godhuli', total_seats: 480, base_price: 920, train_class: 'AC' },
  { train_number: '710', name: 'Ekota Express', total_seats: 520, base_price: 980, train_class: 'AC' },
  { train_number: '711', name: 'Ekota Express', total_seats: 520, base_price: 980, train_class: 'AC' },
  { train_number: '720', name: 'Parabat Express', total_seats: 450, base_price: 950, train_class: 'AC' },
  { train_number: '721', name: 'Parabat Express', total_seats: 450, base_price: 950, train_class: 'AC' },
  { train_number: '730', name: 'Sundarban Express', total_seats: 600, base_price: 850, train_class: 'Sleeper' },
  { train_number: '731', name: 'Sundarban Express', total_seats: 600, base_price: 850, train_class: 'Sleeper' },
  { train_number: '740', name: 'Turna Express', total_seats: 550, base_price: 1050, train_class: 'AC' },
  { train_number: '741', name: 'Turna Express', total_seats: 550, base_price: 1050, train_class: 'AC' },
  { train_number: '750', name: 'Rupsha Express', total_seats: 700, base_price: 650, train_class: 'Sleeper' },
  { train_number: '751', name: 'Rupsha Express', total_seats: 700, base_price: 650, train_class: 'Sleeper' },
  { train_number: '760', name: 'Kalni Express', total_seats: 500, base_price: 880, train_class: 'AC' },
  { train_number: '761', name: 'Kalni Express', total_seats: 500, base_price: 880, train_class: 'AC' },
  { train_number: '770', name: 'Drutojan Express', total_seats: 420, base_price: 1180, train_class: 'Executive' },
  { train_number: '771', name: 'Drutojan Express', total_seats: 420, base_price: 1180, train_class: 'Executive' },
  { train_number: '780', name: 'Titumir Express', total_seats: 650, base_price: 720, train_class: 'Sleeper' },
  { train_number: '781', name: 'Titumir Express', total_seats: 650, base_price: 720, train_class: 'Sleeper' },
  { train_number: '790', name: 'Rajanikanta Express', total_seats: 500, base_price: 780, train_class: 'Sleeper' },
  { train_number: '791', name: 'Rajanikanta Express', total_seats: 500, base_price: 780, train_class: 'Sleeper' },
  { train_number: '810', name: 'Chitra Express', total_seats: 550, base_price: 680, train_class: 'Sleeper' },
  { train_number: '811', name: 'Chitra Express', total_seats: 550, base_price: 680, train_class: 'Sleeper' },
  { train_number: '820', name: 'Lalmoni Express', total_seats: 480, base_price: 820, train_class: 'Sleeper' },
  { train_number: '821', name: 'Lalmoni Express', total_seats: 480, base_price: 820, train_class: 'Sleeper' },
];

/** Routes: train_number + station codes, times, duration (min), distance (km) */
const ROUTES = [
  // —— Dhaka hub ——
  { train: '701', source: 'DHK', dest: 'CTG', departure: '06:40:00', arrival: '13:20:00', duration: 400, distance: 245 },
  { train: '702', source: 'CTG', dest: 'DHK', departure: '15:00:00', arrival: '21:40:00', duration: 400, distance: 245 },
  { train: '720', source: 'DHK', dest: 'SYL', departure: '06:20:00', arrival: '13:10:00', duration: 410, distance: 248 },
  { train: '721', source: 'SYL', dest: 'DHK', departure: '14:30:00', arrival: '21:20:00', duration: 410, distance: 248 },
  { train: '731', source: 'DHK', dest: 'KHL', departure: '20:30:00', arrival: '03:45:00', duration: 435, distance: 272 },
  { train: '730', source: 'KHL', dest: 'DHK', departure: '21:30:00', arrival: '04:45:00', duration: 435, distance: 272 },
  { train: '740', source: 'DHK', dest: 'RJSH', departure: '14:40:00', arrival: '21:50:00', duration: 430, distance: 268 },
  { train: '741', source: 'RJSH', dest: 'DHK', departure: '07:00:00', arrival: '14:10:00', duration: 430, distance: 268 },
  { train: '750', source: 'DHK', dest: 'RGP', departure: '08:15:00', arrival: '16:30:00', duration: 495, distance: 320 },
  { train: '751', source: 'RGP', dest: 'DHK', departure: '17:00:00', arrival: '01:15:00', duration: 495, distance: 320 },
  { train: '705', source: 'DHK', dest: 'MYM', departure: '07:45:00', arrival: '10:30:00', duration: 165, distance: 115 },
  { train: '706', source: 'MYM', dest: 'DHK', departure: '16:20:00', arrival: '19:05:00', duration: 165, distance: 115 },
  { train: '710', source: 'DHK', dest: 'TGL', departure: '09:30:00', arrival: '11:15:00', duration: 105, distance: 72 },
  { train: '711', source: 'TGL', dest: 'DHK', departure: '17:40:00', arrival: '19:25:00', duration: 105, distance: 72 },
  { train: '760', source: 'DHK', dest: 'COM', departure: '08:00:00', arrival: '10:15:00', duration: 135, distance: 98 },
  { train: '761', source: 'COM', dest: 'DHK', departure: '18:30:00', arrival: '20:45:00', duration: 135, distance: 98 },

  // —— Chattogram / Sylhet corridor ——
  { train: '701', source: 'CTG', dest: 'COM', departure: '14:20:00', arrival: '16:10:00', duration: 110, distance: 95 },
  { train: '702', source: 'COM', dest: 'CTG', departure: '12:30:00', arrival: '14:20:00', duration: 110, distance: 95 },
  { train: '720', source: 'COM', dest: 'SYL', departure: '18:00:00', arrival: '21:30:00', duration: 210, distance: 120 },
  { train: '721', source: 'SYL', dest: 'COM', departure: '07:15:00', arrival: '10:45:00', duration: 210, distance: 120 },
  { train: '770', source: 'CTG', dest: 'SYL', departure: '22:00:00', arrival: '06:30:00', duration: 510, distance: 310 },
  { train: '771', source: 'SYL', dest: 'CTG', departure: '21:00:00', arrival: '05:30:00', duration: 510, distance: 310 },

  // —— Khulna / southwest ——
  { train: '780', source: 'KHL', dest: 'CTG', departure: '19:00:00', arrival: '03:20:00', duration: 500, distance: 320 },
  { train: '781', source: 'CTG', dest: 'KHL', departure: '20:15:00', arrival: '04:35:00', duration: 500, distance: 320 },
  { train: '810', source: 'KHL', dest: 'JSS', departure: '06:30:00', arrival: '08:45:00', duration: 135, distance: 72 },
  { train: '811', source: 'JSS', dest: 'KHL', departure: '17:00:00', arrival: '19:15:00', duration: 135, distance: 72 },
  { train: '810', source: 'JSS', dest: 'DHK', departure: '09:00:00', arrival: '14:30:00', duration: 330, distance: 195 },
  { train: '811', source: 'DHK', dest: 'JSS', departure: '15:30:00', arrival: '21:00:00', duration: 330, distance: 195 },

  // —— North / Rajshahi / Rangpur ——
  { train: '730', source: 'DHK', dest: 'BOG', departure: '09:00:00', arrival: '14:45:00', duration: 345, distance: 198 },
  { train: '731', source: 'BOG', dest: 'DHK', departure: '15:20:00', arrival: '21:05:00', duration: 345, distance: 198 },
  { train: '790', source: 'RJSH', dest: 'BOG', departure: '08:30:00', arrival: '11:00:00', duration: 150, distance: 95 },
  { train: '791', source: 'BOG', dest: 'RJSH', departure: '17:30:00', arrival: '20:00:00', duration: 150, distance: 95 },
  { train: '790', source: 'BOG', dest: 'RGP', departure: '12:15:00', arrival: '15:45:00', duration: 210, distance: 125 },
  { train: '791', source: 'RGP', dest: 'BOG', departure: '10:00:00', arrival: '13:30:00', duration: 210, distance: 125 },
  { train: '820', source: 'DHK', dest: 'DIN', departure: '22:30:00', arrival: '07:15:00', duration: 525, distance: 352 },
  { train: '821', source: 'DIN', dest: 'DHK', departure: '20:00:00', arrival: '04:45:00', duration: 525, distance: 352 },
  { train: '820', source: 'DIN', dest: 'RGP', departure: '08:00:00', arrival: '11:30:00', duration: 210, distance: 118 },
  { train: '821', source: 'RGP', dest: 'DIN', departure: '14:00:00', arrival: '17:30:00', duration: 210, distance: 118 },

  // —— Cross-region ——
  { train: '705', source: 'RJSH', dest: 'KHL', departure: '23:00:00', arrival: '08:30:00', duration: 570, distance: 385 },
  { train: '706', source: 'KHL', dest: 'RJSH', departure: '22:00:00', arrival: '07:30:00', duration: 570, distance: 385 },
  { train: '710', source: 'SYL', dest: 'CTG', departure: '23:30:00', arrival: '06:00:00', duration: 390, distance: 228 },
  { train: '711', source: 'CTG', dest: 'SYL', departure: '22:45:00', arrival: '05:15:00', duration: 390, distance: 228 },
  { train: '770', source: 'DHK', dest: 'BOG', departure: '13:00:00', arrival: '18:20:00', duration: 320, distance: 198 },
  { train: '771', source: 'BOG', dest: 'DHK', departure: '10:30:00', arrival: '15:50:00', duration: 320, distance: 198 },
];

async function getStationMap(connection) {
  const [rows] = await connection.query('SELECT id, code FROM stations');
  return Object.fromEntries(rows.map((r) => [r.code, r.id]));
}

async function getTrainMap(connection) {
  const [rows] = await connection.query('SELECT id, train_number FROM trains');
  return Object.fromEntries(rows.map((r) => [r.train_number, r.id]));
}

async function seed() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('Clearing existing route data...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE tickets');
    await connection.query('TRUNCATE TABLE waitlist');
    await connection.query('TRUNCATE TABLE bookings');
    await connection.query('TRUNCATE TABLE route_fares');
    await connection.query('TRUNCATE TABLE routes');
    await connection.query('TRUNCATE TABLE trains');
    await connection.query('TRUNCATE TABLE stations');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('Inserting Bangladesh stations...');
    for (const s of STATIONS) {
      await connection.query(
        'INSERT INTO stations (name, code, city, state) VALUES (?, ?, ?, ?)',
        [s.name, s.code, s.city, s.state]
      );
    }

    console.log('Inserting trains...');
    for (const t of TRAINS) {
      await connection.query(
        `INSERT INTO trains (train_number, name, total_seats, base_price, train_class)
         VALUES (?, ?, ?, ?, ?)`,
        [t.train_number, t.name, t.total_seats, t.base_price, t.train_class]
      );
    }

    const stationMap = await getStationMap(connection);
    const trainMap = await getTrainMap(connection);

    console.log('Inserting routes...');
    for (const r of ROUTES) {
      const trainId = trainMap[r.train];
      const sourceId = stationMap[r.source];
      const destId = stationMap[r.dest];
      if (!trainId || !sourceId || !destId) {
        throw new Error(`Invalid route reference: ${JSON.stringify(r)}`);
      }
      await connection.query(
        `INSERT INTO routes
         (train_id, source_station_id, destination_station_id, departure_time, arrival_time, duration_minutes, distance_km)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [trainId, sourceId, destId, r.departure, r.arrival, r.duration, r.distance]
      );
    }

    console.log('Inserting route fares (Economy / Business / First Class)...');
    const [routeRows] = await connection.query(
      `SELECT r.id AS route_id, t.base_price, t.total_seats
       FROM routes r
       INNER JOIN trains t ON t.id = r.train_id`
    );

    const fareInserts = [];
    for (const route of routeRows) {
      const totalSeats = Number(route.total_seats);
      const economyBase = Number(route.base_price);
      let allocated = 0;

      FARE_CLASS_IDS.forEach((fareClass, index) => {
        const isLast = index === FARE_CLASS_IDS.length - 1;
        const seatQuota = isLast
          ? Math.max(1, totalSeats - allocated)
          : Math.max(1, Math.floor(totalSeats * SEAT_QUOTA_PERCENT[fareClass]));
        allocated += seatQuota;
        const basePrice = Math.round(economyBase * BASE_PRICE_MULTIPLIER[fareClass]);

        fareInserts.push({
          routeId: route.route_id,
          fareClass,
          basePrice,
          seatQuota,
        });
      });
    }

    if (fareInserts.length) {
      const values = fareInserts.map((f) => [
        f.routeId,
        f.fareClass,
        f.basePrice,
        f.seatQuota,
      ]);
      await connection.query(
        'INSERT INTO route_fares (route_id, fare_class, base_price, seat_quota) VALUES ?',
        [values]
      );
    }

    await connection.commit();

    const [[{ stationCount }]] = await pool.query('SELECT COUNT(*) AS stationCount FROM stations');
    const [[{ trainCount }]] = await pool.query('SELECT COUNT(*) AS trainCount FROM trains');
    const [[{ routeCount }]] = await pool.query('SELECT COUNT(*) AS routeCount FROM routes');
    const [[{ fareCount }]] = await pool.query('SELECT COUNT(*) AS fareCount FROM route_fares');

    const adminHash = await bcrypt.hash('Admin@1234', 12);
    await userModel.upsertAdmin({
      email: 'admin@railbook.com',
      passwordHash: adminHash,
      fullName: 'Admin',
    });

    console.log('Seed complete (Bangladesh Railway).');
    console.log(`  Stations: ${stationCount}`);
    console.log(`  Trains:   ${trainCount}`);
    console.log(`  Routes:   ${routeCount}`);
    console.log(`  Fares:    ${fareCount} (3 classes per route)`);
    console.log('\nAdmin login (after npm run migrate):');
    console.log('  Email:    admin@railbook.com');
    console.log('  Password: Admin@1234');
    console.log('  UI:       http://localhost:5173/login → redirects to /admin');
    console.log('\nExample searches:');
    console.log('  GET /trains/search?source=DHK&destination=CTG&date=2026-06-15');
    console.log('  GET /trains/search?source=KHL&destination=JSS&date=2026-06-20');
    console.log('  GET /trains/search?source=MYM&destination=DHK&date=2026-06-20');
    console.log('  GET /trains/search?source=DIN&destination=RGP&date=2026-06-20');
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
