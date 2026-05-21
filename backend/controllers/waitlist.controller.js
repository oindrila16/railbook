/**
 * Waitlist HTTP handlers.
 */
const waitlistService = require('../services/waitlist.service');

async function getStatus(req, res) {
  const { routeId, date } = req.query;
  const result = await waitlistService.getWaitlistStatus(req.user.id, {
    routeId: routeId ? parseInt(routeId, 10) : undefined,
    travelDate: date,
  });
  res.json({ success: true, data: result });
}

async function join(req, res) {
  const { routeId, travelDate, passengers, fareClass } = req.body;
  const result = await waitlistService.joinWaitlist(req.user.id, {
    routeId,
    travelDate,
    passengers,
    fareClass,
  });
  res.status(201).json({ success: true, data: result });
}

async function cancel(req, res) {
  const waitlistId = parseInt(req.params.id, 10);
  const result = await waitlistService.cancelWaitlistEntry(req.user.id, waitlistId);
  res.json({ success: true, data: result });
}

module.exports = { getStatus, join, cancel };
