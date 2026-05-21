/**
 * Fare matrix: all routes × fare classes × travel dates with dynamic prices.
 */
const routeMatrixModel = require('../models/routeMatrix.model');
const fareClassService = require('./fareClass.service');
const { FARE_CLASS_IDS } = require('../config/fareClasses');
const { buildDateRange } = require('../utils/dates');

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function mapRouteStatic(row) {
  return {
    routeId: row.route_id,
    train: {
      id: row.train_id,
      number: row.train_number,
      name: row.train_name,
      class: row.train_class,
    },
    route: {
      source: row.source_station_code,
      sourceName: row.source_station_name,
      destination: row.destination_station_code,
      destinationName: row.destination_station_name,
    },
    schedule: {
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
      durationMinutes: row.duration_minutes,
      durationLabel: formatDuration(row.duration_minutes),
    },
  };
}

function mapFaresForDate(fareMeta) {
  const byClass = {};
  fareMeta.fares.forEach((f) => {
    const displayPrice =
      f.hasOffer && f.offerPrice != null ? f.offerPrice : f.currentPrice;
    byClass[f.class] = {
      class: f.class,
      label: f.label,
      basePrice: f.basePrice,
      currentPrice: f.currentPrice,
      regularPrice: f.regularPrice ?? f.basePrice,
      offerPrice: f.offerPrice,
      hasOffer: f.hasOffer,
      displayPrice,
      savings: f.savings ?? 0,
      savingsPercent: f.savingsPercent ?? 0,
      availableSeats: f.availability.availableSeats,
      seatQuota: f.seatQuota,
      isFull: f.availability.isFull,
      occupancyPercent: f.availability.occupancyPercent,
      surchargePercent: f.pricing?.surchargePercent ?? 0,
    };
  });
  const offerFares = fareMeta.fares.filter((f) => f.hasOffer && f.offerPrice != null);
  const lowestOffer = offerFares.length
    ? Math.min(...offerFares.map((f) => f.offerPrice))
    : null;
  return {
    fares: fareMeta.fares,
    byClass,
    lowestPrice: Math.min(...fareMeta.fares.map((f) => f.currentPrice)),
    lowestOffer,
    lowestRegular: Math.min(...fareMeta.fares.map((f) => f.regularPrice ?? f.basePrice)),
  };
}

/**
 * GET /pricing/matrix — full price grid for UI.
 */
async function getFareMatrix({ days = 7, fromDate }) {
  const dates = buildDateRange(days, fromDate);
  const routeMap = new Map();

  for (const date of dates) {
    const rows = await routeMatrixModel.getAllRoutesForDate(date);
    const fareMetaList = await fareClassService.enrichSearchResults(rows, date);

    rows.forEach((row, i) => {
      const id = row.route_id;
      if (!routeMap.has(id)) {
        routeMap.set(id, {
          ...mapRouteStatic(row),
          pricesByDate: {},
        });
      }
      routeMap.get(id).pricesByDate[date] = mapFaresForDate(fareMetaList[i]);
    });
  }

  const routes = Array.from(routeMap.values()).sort((a, b) =>
    `${a.route.source}${a.route.destination}`.localeCompare(
      `${b.route.source}${b.route.destination}`
    )
  );

  return {
    currency: 'BDT',
    fareClasses: FARE_CLASS_IDS.map((id) => ({
      id,
      label: fareClassService.getFareClassLabel(id),
    })),
    dates,
    routeCount: routes.length,
    routes,
  };
}

module.exports = { getFareMatrix };
