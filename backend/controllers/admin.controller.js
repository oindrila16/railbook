/**
 * Admin HTTP handlers.
 */
const adminService = require('../services/admin.service');

async function getStats(req, res) {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: stats });
}

async function getUsers(req, res) {
  const limit = parseInt(req.query.limit, 10) || 100;
  const users = await adminService.listUsers(limit);
  res.json({ success: true, data: { count: users.length, users } });
}

async function getBookings(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const bookings = await adminService.listBookings(limit);
  res.json({ success: true, data: { count: bookings.length, bookings } });
}

async function getTrains(req, res) {
  const trains = await adminService.listTrains();
  res.json({ success: true, data: { count: trains.length, trains } });
}

async function patchTrain(req, res) {
  const trainId = parseInt(req.params.id, 10);
  const { basePrice, isActive, totalSeats } = req.body;
  const train = await adminService.updateTrain(trainId, { basePrice, isActive, totalSeats });
  res.json({ success: true, data: train });
}

async function getRoutes(req, res) {
  const routes = await adminService.listRoutes();
  res.json({ success: true, data: { count: routes.length, routes } });
}

async function patchRoute(req, res) {
  const routeId = parseInt(req.params.id, 10);
  const { departureTime, arrivalTime, isActive, economyPrice } = req.body;
  const result = await adminService.updateRoute(routeId, {
    departureTime,
    arrivalTime,
    isActive,
    economyPrice,
  });
  res.json({ success: true, data: result });
}

module.exports = {
  getStats,
  getUsers,
  getBookings,
  getTrains,
  patchTrain,
  getRoutes,
  patchRoute,
};
