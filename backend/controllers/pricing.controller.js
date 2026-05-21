/**
 * Dynamic pricing HTTP handlers.
 */
const pricingService = require('../services/pricing.service');
const pricingMatrixService = require('../services/pricingMatrix.service');
const { listFareClasses } = require('../services/fareClass.service');

async function getRules(req, res) {
  res.json({ success: true, data: pricingService.getPricingRules() });
}

async function getQuote(req, res) {
  const { routeId, date, passengers, fareClass, class: classAlias } = req.query;
  const result = await pricingService.getPriceQuote({
    routeId: parseInt(routeId, 10),
    travelDate: date,
    passengerCount: parseInt(passengers, 10) || 1,
    fareClass: fareClass || classAlias,
  });
  res.json({ success: true, data: result });
}

async function getFareClasses(req, res) {
  res.json({ success: true, data: { fareClasses: listFareClasses() } });
}

async function getMatrix(req, res) {
  const { days, fromDate } = req.query;
  const result = await pricingMatrixService.getFareMatrix({
    days: days ? parseInt(days, 10) : 7,
    fromDate: fromDate || undefined,
  });
  res.json({ success: true, data: result });
}

module.exports = { getRules, getQuote, getFareClasses, getMatrix };
