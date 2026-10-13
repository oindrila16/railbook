const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

// Opt-in: every run creates and drops its own database. Never modifies DB_NAME.
test('MySQL migration preserves history, frees cancelled seats, and permits waitlist rejoining', {
  skip: !process.env.MYSQL_TEST_HOST && 'Set MYSQL_TEST_HOST to run isolated MySQL integration tests',
}, async () => {
  const database = `railbook_test_${Date.now()}_${process.pid}`;
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_TEST_HOST,
    port: Number(process.env.MYSQL_TEST_PORT || 3306),
    user: process.env.MYSQL_TEST_USER || 'root',
    password: process.env.MYSQL_TEST_PASSWORD || '',
    multipleStatements: true,
  });
  try {
    await connection.query(`CREATE DATABASE \`${database}\``);
    await connection.query(`USE \`${database}\``);
    const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    // Start with the original constraints to prove upgrades work too.
    const oldSchema = schema
      .replace(/  active_seat_number VARCHAR\(10\) GENERATED ALWAYS AS\s*\(CASE WHEN status = 'active' THEN seat_number ELSE NULL END\) STORED,\s*/, '')
      .replace('(route_id, travel_date, active_seat_number)', '(route_id, travel_date, seat_number)')
      .replace(/  waiting_marker TINYINT GENERATED ALWAYS AS\s*\(CASE WHEN status = 'waiting' THEN 1 ELSE NULL END\) STORED,\s*/, '')
      .replace('(user_id, route_id, travel_date, waiting_marker)', '(user_id, route_id, travel_date)')
      .replace('  attempts        TINYINT UNSIGNED NOT NULL DEFAULT 0,\n', '')
      .replace('  pending_password_hash VARCHAR(255) NULL,\n', '');
    await connection.query(oldSchema);
    await connection.query(`
      INSERT INTO users (id,email,password_hash,full_name,is_verified) VALUES (1,'test@example.com','test','Test User',1);
      INSERT INTO stations (id,name,code,city) VALUES (1,'Source','SRC','Source'),(2,'Destination','DST','Destination');
      INSERT INTO trains (id,train_number,name,total_seats,base_price) VALUES (1,'TEST','Test Express',3,100);
      INSERT INTO routes (id,train_id,source_station_id,destination_station_id,departure_time,arrival_time,duration_minutes) VALUES (1,1,1,2,'06:00','12:00',360);
      INSERT INTO bookings (id,booking_reference,user_id,route_id,travel_date,status,seat_count) VALUES (1,'TEST000001',1,1,'2030-01-01','confirmed',1);
      INSERT INTO tickets (booking_id,route_id,travel_date,passenger_name,passenger_age,passenger_gender,seat_number,ticket_price) VALUES (1,1,'2030-01-01','Test User',30,'other','S1',100);
      INSERT INTO waitlist (user_id,route_id,travel_date,position,status) VALUES (1,1,'2030-01-01',1,'waiting');
    `);
    const migration = fs.readFileSync(path.join(__dirname, '../database/migrations/004_booking_and_auth_safety.sql'), 'utf8');
    await connection.query(migration);
    await connection.query(migration); // repeatable upgrade
    const insertTicket = () => connection.query(`INSERT INTO tickets (booking_id,route_id,travel_date,passenger_name,passenger_age,passenger_gender,seat_number,ticket_price) VALUES (1,1,'2030-01-01','Another User',30,'other','S1',100)`);
    await assert.rejects(insertTicket(), { code: 'ER_DUP_ENTRY' });
    await connection.query("UPDATE tickets SET status='cancelled' WHERE seat_number='S1'");
    await insertTicket();
    await connection.query("UPDATE tickets SET status='cancelled' WHERE status='active'");
    await insertTicket();
    const [ticketCounts] = await connection.query("SELECT COUNT(*) AS total, SUM(status='active') AS active FROM tickets");
    assert.equal(ticketCounts[0].total, 3);
    assert.equal(Number(ticketCounts[0].active), 1);
    const insertWaiting = () => connection.query("INSERT INTO waitlist (user_id,route_id,travel_date,position,status) VALUES (1,1,'2030-01-01',1,'waiting')");
    await assert.rejects(insertWaiting(), { code: 'ER_DUP_ENTRY' });
    await connection.query("UPDATE waitlist SET status='cancelled'");
    await insertWaiting();
    const [waitingCounts] = await connection.query('SELECT COUNT(*) AS total FROM waitlist');
    assert.equal(waitingCounts[0].total, 2);
  } finally {
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.end();
  }
});
