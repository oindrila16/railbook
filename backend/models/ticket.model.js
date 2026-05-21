/**
 * Ticket data access layer.
 */
const pool = require('../config/database');

/** Active booked seats for a route + date (read-only, for seat map) */
async function getBookedSeatsActive(routeId, travelDate) {
  const [rows] = await pool.query(
    `SELECT tk.seat_number
     FROM tickets tk
     INNER JOIN bookings b ON b.id = tk.booking_id
     WHERE tk.route_id = ?
       AND tk.travel_date = ?
       AND tk.status = 'active'
       AND b.status IN ('confirmed', 'pending')`,
    [routeId, travelDate]
  );
  return rows.map((r) => r.seat_number);
}

/** Booked seat numbers for a route + date (use inside transaction) */
async function getBookedSeatsForUpdate(connection, routeId, travelDate) {
  const [rows] = await connection.query(
    `SELECT tk.seat_number
     FROM tickets tk
     INNER JOIN bookings b ON b.id = tk.booking_id
     WHERE tk.route_id = ?
       AND tk.travel_date = ?
       AND tk.status = 'active'
       AND b.status IN ('confirmed', 'pending')
     FOR UPDATE`,
    [routeId, travelDate]
  );
  return rows.map((r) => r.seat_number);
}

async function createMany(connection, tickets) {
  if (!tickets.length) return;

  const values = tickets.map((t) => [
    t.bookingId,
    t.routeId,
    t.travelDate,
    t.passengerName,
    t.passengerAge,
    t.passengerGender,
    t.seatNumber,
    t.ticketPrice,
    t.fareClass || 'economy',
  ]);

  await connection.query(
    `INSERT INTO tickets
     (booking_id, route_id, travel_date, passenger_name, passenger_age, passenger_gender,
      seat_number, ticket_price, fare_class)
     VALUES ?`,
    [values]
  );
}

async function findByBookingId(bookingId) {
  const [rows] = await pool.query(
    `SELECT id, booking_id, route_id, travel_date, passenger_name, passenger_age,
            passenger_gender, seat_number, ticket_price, fare_class, status, created_at
     FROM tickets WHERE booking_id = ? ORDER BY seat_number`,
    [bookingId]
  );
  return rows;
}

async function findByBookingIds(bookingIds) {
  if (!bookingIds.length) return [];
  const [rows] = await pool.query(
    `SELECT id, booking_id, route_id, travel_date, passenger_name, passenger_age,
            passenger_gender, seat_number, ticket_price, status, created_at
     FROM tickets WHERE booking_id IN (?)
     ORDER BY booking_id, seat_number`,
    [bookingIds]
  );
  return rows;
}

async function cancelByBookingId(connection, bookingId) {
  await connection.query(
    `UPDATE tickets SET status = 'cancelled', updated_at = NOW() WHERE booking_id = ?`,
    [bookingId]
  );
}

module.exports = {
  getBookedSeatsActive,
  getBookedSeatsForUpdate,
  createMany,
  findByBookingId,
  findByBookingIds,
  cancelByBookingId,
};
