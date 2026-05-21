/**
 * Train search business logic.
 */
const ApiError = require('../utils/ApiError');
const stationModel = require('../models/station.model');
const trainModel = require('../models/train.model');
const fareClassService = require('./fareClass.service');

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function mapSearchResult(row, fareMeta, travelDate, preferredFareClass) {
  const { fares, totalAvailability } = fareMeta;
  const selectedFare =
    (preferredFareClass && fareClassService.pickFareForClass(fares, preferredFareClass)) ||
    fareMeta.selectedFare;
  const totalSeats = Number(row.total_seats);

  return {
    routeId: row.route_id,
    train: {
      id: row.train_id,
      number: row.train_number,
      name: row.train_name,
      class: row.train_class,
      totalSeats,
    },
    source: {
      id: row.source_station_id,
      name: row.source_station_name,
      code: row.source_station_code,
      city: row.source_city,
    },
    destination: {
      id: row.destination_station_id,
      name: row.destination_station_name,
      code: row.destination_station_code,
      city: row.destination_city,
    },
    schedule: {
      departureTime: row.departure_time,
      arrivalTime: row.arrival_time,
      durationMinutes: row.duration_minutes,
      durationLabel: formatDuration(row.duration_minutes),
      distanceKm: row.distance_km ? Number(row.distance_km) : null,
    },
    travelDate,
    fares,
    availability: {
      bookedSeats: selectedFare.availability.bookedSeats,
      availableSeats: selectedFare.availability.availableSeats,
      occupancyPercent: selectedFare.availability.occupancyPercent,
      isFull: selectedFare.availability.isFull,
      waitlistCount: totalAvailability.waitlistCount,
    },
    pricing: selectedFare.pricing,
    fareClass: selectedFare.class,
    fareClassLabel: selectedFare.label,
  };
}

/**
 * Search trains by source/destination station codes and travel date.
 */
async function searchTrains({ source, destination, date, fareClass }) {
  const preferredFareClass = fareClass
    ? fareClassService.normalizeFareClass(fareClass)
    : null;
  if (fareClass && !preferredFareClass) {
    throw ApiError.badRequest('fareClass must be economy, business, or first');
  }
  const sourceCode = source.trim().toUpperCase();
  const destCode = destination.trim().toUpperCase();

  if (sourceCode === destCode) {
    throw ApiError.badRequest('Source and destination must be different');
  }

  const sourceStation = await stationModel.findByCode(sourceCode);
  if (!sourceStation) {
    throw ApiError.notFound(`Source station not found: ${sourceCode}`);
  }

  const destStation = await stationModel.findByCode(destCode);
  if (!destStation) {
    throw ApiError.notFound(`Destination station not found: ${destCode}`);
  }

  const rows = await trainModel.searchRoutes({
    sourceStationId: sourceStation.id,
    destinationStationId: destStation.id,
    travelDate: date,
  });

  const fareMetaList = await fareClassService.enrichSearchResults(
    rows,
    date,
    preferredFareClass
  );
  const trains = rows.map((row, i) =>
    mapSearchResult(row, fareMetaList[i], date, preferredFareClass)
  );

  return {
    query: {
      source: sourceStation.code,
      sourceName: sourceStation.name,
      destination: destStation.code,
      destinationName: destStation.name,
      date,
      fareClass: preferredFareClass || 'economy',
    },
    count: trains.length,
    trains,
  };
}

async function listStations() {
  const stations = await stationModel.findAll();
  return stations.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    city: s.city,
    state: s.state,
  }));
}

module.exports = { searchTrains, listStations };
