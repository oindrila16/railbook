/**
 * Simulated live train running status from schedule + current time.
 * (Demo — not connected to real GPS/track data.)
 */
const pool = require('../config/database');
const ApiError = require('../utils/ApiError');

function parseTimeOnDate(timeStr, dateStr) {
  const [h, m, s] = timeStr.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, m, s || 0, 0);
  return d;
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

/** Deterministic mock delay in minutes from route id + date */
function mockDelayMinutes(routeId, travelDate) {
  const seed = routeId + travelDate.replace(/-/g, '');
  return (seed % 23) - 7;
}

function computeLegStatus(route, travelDate) {
  const now = new Date();
  const dep = parseTimeOnDate(route.departure_time, travelDate);
  let arr = parseTimeOnDate(route.arrival_time, travelDate);
  if (arr <= dep) {
    arr = new Date(arr.getTime() + 24 * 60 * 60 * 1000);
  }

  const delayMin = mockDelayMinutes(route.route_id, travelDate);
  const effectiveDep = new Date(dep.getTime() + delayMin * 60 * 1000);
  const journeyMs = arr.getTime() - dep.getTime();
  const effectiveArr = new Date(effectiveDep.getTime() + journeyMs);

  const travelDay = new Date(travelDate + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  travelDay.setHours(0, 0, 0, 0);

  if (travelDay > today) {
    return {
      status: 'scheduled',
      statusLabel: 'Scheduled',
      delayMinutes: 0,
      progressPercent: 0,
      message: 'Train has not departed yet',
      atStation: route.source_name,
      nextStation: route.source_name,
    };
  }

  if (travelDay < today) {
    return {
      status: 'completed',
      statusLabel: 'Journey completed',
      delayMinutes: delayMin,
      progressPercent: 100,
      message: 'Train has arrived at destination',
      atStation: route.destination_name,
      nextStation: null,
    };
  }

  if (now < effectiveDep) {
    return {
      status: 'scheduled',
      statusLabel: delayMin > 0 ? `Delayed · starts in ${delayMin} min` : 'On time · awaiting departure',
      delayMinutes: Math.max(0, delayMin),
      progressPercent: 0,
      message: `Waiting at ${route.source_name}`,
      atStation: route.source_name,
      nextStation: route.source_name,
    };
  }

  if (now >= effectiveArr) {
    return {
      status: 'arrived',
      statusLabel: delayMin !== 0 ? `Arrived · ${delayMin > 0 ? '+' : ''}${delayMin} min` : 'Arrived on time',
      delayMinutes: delayMin,
      progressPercent: 100,
      message: `Arrived at ${route.destination_name}`,
      atStation: route.destination_name,
      nextStation: null,
    };
  }

  const elapsed = now.getTime() - effectiveDep.getTime();
  const progress = Math.min(99, Math.round((elapsed / journeyMs) * 100));

  return {
    status: 'running',
    statusLabel: delayMin > 0 ? `Running · ${delayMin} min late` : 'Running · on time',
    delayMinutes: delayMin,
    progressPercent: progress,
    message: `En route to ${route.destination_name}`,
    atStation: null,
    nextStation: route.destination_name,
  };
}

async function getRoutesForTrain(trainNumber, travelDate) {
  const [rows] = await pool.query(
    `SELECT r.id AS route_id, r.departure_time, r.arrival_time, r.duration_minutes,
            t.train_number, t.name AS train_name,
            src.code AS source_code, src.name AS source_name,
            dest.code AS destination_code, dest.name AS destination_name
     FROM routes r
     INNER JOIN trains t ON t.id = r.train_id AND t.is_active = 1
     INNER JOIN stations src ON src.id = r.source_station_id
     INNER JOIN stations dest ON dest.id = r.destination_station_id
     WHERE t.train_number = ? AND r.is_active = 1
     ORDER BY r.departure_time ASC`,
    [trainNumber.trim()]
  );
  return rows;
}

async function listActiveTrains() {
  const [rows] = await pool.query(
    `SELECT DISTINCT t.train_number, t.name AS train_name, t.train_class
     FROM trains t
     INNER JOIN routes r ON r.train_id = t.id AND r.is_active = 1
     WHERE t.is_active = 1
     ORDER BY t.train_number ASC`
  );
  return rows.map((r) => ({
    number: r.train_number,
    name: r.train_name,
    class: r.train_class,
  }));
}

async function getLiveStatus({ trainNumber, travelDate }) {
  const date = travelDate || new Date().toISOString().slice(0, 10);
  const routes = await getRoutesForTrain(trainNumber, date);

  if (!routes.length) {
    throw ApiError.notFound(`Train ${trainNumber} not found or has no active routes`);
  }

  const legs = routes.map((route) => {
    const live = computeLegStatus(route, date);
    return {
      routeId: route.route_id,
      source: route.source_code,
      sourceName: route.source_name,
      destination: route.destination_code,
      destinationName: route.destination_name,
      departureTime: route.departure_time,
      arrivalTime: route.arrival_time,
      durationLabel: formatDuration(route.duration_minutes),
      ...live,
    };
  });

  const primary = legs[0];

  return {
    trainNumber: routes[0].train_number,
    trainName: routes[0].train_name,
    travelDate: date,
    updatedAt: new Date().toISOString(),
    status: primary.status,
    statusLabel: primary.statusLabel,
    delayMinutes: primary.delayMinutes,
    legs,
  };
}

async function listLiveOverview(travelDate) {
  const date = travelDate || new Date().toISOString().slice(0, 10);
  const trains = await listActiveTrains();
  const overview = [];

  for (const train of trains) {
    const routes = await getRoutesForTrain(train.number, date);
    if (!routes.length) continue;
    const live = computeLegStatus(routes[0], date);
    overview.push({
      trainNumber: train.number,
      trainName: train.name,
      route: `${routes[0].source_code} → ${routes[0].destination_code}`,
      departureTime: routes[0].departure_time?.slice(0, 5),
      ...live,
    });
  }

  return { travelDate: date, updatedAt: new Date().toISOString(), trains: overview };
}

module.exports = { getLiveStatus, listLiveOverview, listActiveTrains };
