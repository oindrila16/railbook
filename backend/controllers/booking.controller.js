/**
 * Booking HTTP handlers.
 */
const bookingService = require('../services/booking.service');

async function create(req, res) {
  const { routeId, travelDate, passengers, fareClass } = req.body;
  const result = await bookingService.createBooking(req.user.id, {
    routeId,
    travelDate,
    passengers,
    fareClass,
  });

  const statusCode = result.status === 'confirmed' ? 201 : 200;
  res.status(statusCode).json({ success: true, data: result });
}

async function getUserBookings(req, res) {
  const result = await bookingService.getUserBookings(req.user.id);
  res.json({ success: true, data: result });
}

async function cancel(req, res) {
  const bookingId = parseInt(req.params.id, 10);
  const result = await bookingService.cancelBooking(req.user.id, bookingId);
  res.json({ success: true, data: result });
}

module.exports = { create, getUserBookings, cancel };
