const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

test('capacity changes are atomic and protect future bookings and waitlists', {
  skip: !process.env.MYSQL_TEST_HOST && 'Set MYSQL_TEST_HOST for MySQL tests',
}, async () => {
  const database = `railbook_capacity_${Date.now()}_${process.pid}`;
  const credentials = {
    host: process.env.MYSQL_TEST_HOST, port: Number(process.env.MYSQL_TEST_PORT || 3306),
    user: process.env.MYSQL_TEST_USER || 'root', password: process.env.MYSQL_TEST_PASSWORD || '',
  };
  const connection = await mysql.createConnection({ ...credentials, multipleStatements: true });
  let pool;
  try {
    await connection.query(`CREATE DATABASE \`${database}\``);
    await connection.query(`USE \`${database}\``);
    await connection.query(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
    await connection.query(`
      INSERT INTO users(id,email,password_hash,full_name,is_verified) VALUES(1,'test@example.invalid','test','Test',1);
      INSERT INTO stations(id,name,code,city) VALUES(1,'Source','SRC','Source'),(2,'Destination','DST','Destination');
      INSERT INTO trains(id,train_number,name,total_seats,base_price) VALUES(1,'TEST','Test',3,100);
      INSERT INTO routes(id,train_id,source_station_id,destination_station_id,departure_time,arrival_time,duration_minutes) VALUES(1,1,1,2,'06:00','12:00',360);
      INSERT INTO route_fares(route_id,fare_class,base_price,seat_quota) VALUES(1,'economy',100,1),(1,'business',200,1),(1,'first',300,1);
    `);
    Object.assign(process.env, {
      DB_HOST: credentials.host, DB_PORT: String(credentials.port), DB_USER: credentials.user,
      DB_PASSWORD: credentials.password, DB_NAME: database,
    });
    const { updateTrain } = require('../services/admin.service');
    pool = require('../config/database');
    await assert.rejects(updateTrain(1, { totalSeats: 1 }), { statusCode: 400 });
    await assert.rejects(connection.query('UPDATE trains SET total_seats=1 WHERE id=1'), { code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
    await updateTrain(1, { totalSeats: 4 });
    const [fares] = await connection.query('SELECT SUM(seat_quota) AS seats FROM route_fares WHERE route_id=1');
    assert.equal(Number(fares[0].seats), 4);
    await connection.query("INSERT INTO bookings(booking_reference,user_id,route_id,travel_date,status,seat_count) VALUES('CAPACITY0001',1,1,'2099-01-01','confirmed',1)");
    await assert.rejects(updateTrain(1, { totalSeats: 6, basePrice: 999 }), { statusCode: 409 });
    let [trains] = await connection.query('SELECT total_seats,base_price FROM trains WHERE id=1');
    assert.equal(trains[0].total_seats, 4);
    assert.equal(Number(trains[0].base_price), 100);
    await connection.query("UPDATE bookings SET status='cancelled'");
    await connection.query("INSERT INTO waitlist(user_id,route_id,travel_date,position,status) VALUES(1,1,'2099-01-01',1,'waiting')");
    await assert.rejects(updateTrain(1, { totalSeats: 6 }), { statusCode: 409 });
    await connection.query("UPDATE waitlist SET status='cancelled'");
    await updateTrain(1, { totalSeats: 6, basePrice: 150 });
    [trains] = await connection.query('SELECT total_seats,base_price FROM trains WHERE id=1');
    assert.equal(trains[0].total_seats, 6);
    assert.equal(Number(trains[0].base_price), 150);
  } finally {
    if (pool) await pool.end();
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.end();
  }
});
