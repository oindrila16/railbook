/**
 * Train search HTTP handlers.
 */
const trainService = require('../services/train.service');
const availabilityService = require('../services/availability.service');
const liveStatusService = require('../services/liveStatus.service');
const seatMapService = require('../services/seatMap.service');
const ApiError = require('../utils/ApiError');

async function search(req, res) {
  const { source, destination, date, class: fareClass } = req.query;
  const result = await trainService.searchTrains({
    source,
    destination,
    date,
    fareClass,
  });
  res.json({ success: true, data: result });
}

async function getStations(req, res) {
  const stations = await trainService.listStations();
  res.json({ success: true, data: { count: stations.length, stations } });
}

async function getAvailability(req, res) {
  const routeId = parseInt(req.params.routeId, 10);
  const { date, class: fareClass } = req.query;

  if (!date) {
    throw ApiError.badRequest('Query param date (YYYY-MM-DD) is required');
  }

  const snapshot = await availabilityService.getSnapshot(routeId, date, fareClass);
  if (!snapshot.found) {
    throw ApiError.notFound('Route not found');
  }

  res.json({ success: true, data: snapshot });
}

async function getLiveStatus(req, res) {
  const { trainNumber, date } = req.query;
  if (!trainNumber) {
    throw ApiError.badRequest('Query param trainNumber is required');
  }
  const result = await liveStatusService.getLiveStatus({ trainNumber, travelDate: date });
  res.json({ success: true, data: result });
}

async function getLiveOverview(req, res) {
  const { date } = req.query;
  const result = await liveStatusService.listLiveOverview(date);
  res.json({ success: true, data: result });
}

async function listTrains(req, res) {
  const trains = await liveStatusService.listActiveTrains();
  res.json({ success: true, data: { count: trains.length, trains } });
}

async function getSeatAvailability(req, res) {
  const { source, destination, date, class: fareClass } = req.query;
  const result = await trainService.searchTrains({
    source,
    destination,
    date,
    fareClass,
  });
  res.json({
    success: true,
    data: {
      query: result.query,
      date: result.query.date,
      routes: result.trains.map((t) => ({
        routeId: t.routeId,
        train: t.train,
        route: {
          source: t.source.code,
          destination: t.destination.code,
          sourceName: t.source.name,
          destinationName: t.destination.name,
        },
        schedule: t.schedule,
        fares: t.fares,
        availability: t.availability,
        pricing: t.pricing,
        fareClass: t.fareClass,
        fareClassLabel: t.fareClassLabel,
      })),
      count: result.count,
    },
  });
}

async function getSeatMap(req, res) {
  const routeId = parseInt(req.params.routeId, 10);
  const { date, class: fareClass } = req.query;

  if (!date) {
    throw ApiError.badRequest('Query param date (YYYY-MM-DD) is required');
  }

  const map = await seatMapService.getSeatMap(routeId, date, fareClass);
  res.json({ success: true, data: map });
}

module.exports = {
  search,
  getStations,
  getAvailability,
  getSeatMap,
  getLiveStatus,
  getLiveOverview,
  listTrains,
  getSeatAvailability,
};
