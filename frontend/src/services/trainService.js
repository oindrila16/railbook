import api from './api';
import { FALLBACK_STATIONS } from '../data/fallbackStations';

let lastStationsFromApi = false;

/** Whether the last getStations() call used the live API */
export function stationsLoadedFromApi() {
  return lastStationsFromApi;
}

export async function searchTrains({ source, destination, date, fareClass }) {
  const { data } = await api.get('/trains/search', {
    params: { source, destination, date, class: fareClass },
  });
  return data.data;
}

export async function getStations() {
  try {
    const { data } = await api.get('/trains/stations', { timeout: 10000 });
    const stations = data?.data?.stations ?? data?.stations;

    if (Array.isArray(stations) && stations.length > 0) {
      lastStationsFromApi = true;
      return stations;
    }
  } catch {
    lastStationsFromApi = false;
  }

  lastStationsFromApi = false;
  return [...FALLBACK_STATIONS];
}

export async function lookupPnr(reference) {
  const { data } = await api.get(`/pnr/${encodeURIComponent(reference.trim())}`);
  return data.data;
}

export async function getLiveStatus({ trainNumber, date }) {
  const { data } = await api.get('/trains/live', {
    params: { trainNumber, date },
  });
  return data.data;
}

export async function getLiveOverview(date) {
  const { data } = await api.get('/trains/live', { params: { date } });
  return data.data;
}

export async function listTrains() {
  const { data } = await api.get('/trains/list');
  return data.data.trains || [];
}

export async function getSeatAvailability({ source, destination, date, fareClass }) {
  const { data } = await api.get('/trains/seats', {
    params: { source, destination, date, class: fareClass },
  });
  return data.data;
}

export async function getSeatMap({ routeId, date, fareClass }) {
  const { data } = await api.get(`/trains/seat-map/${routeId}`, {
    params: { date, class: fareClass },
  });
  return data.data;
}

export async function getPopularRoutes(limit = 6) {
  try {
    const { data } = await api.get('/recommendations/popular', { params: { limit } });
    return data.data.suggested || data.data.popular || [];
  } catch {
    return [];
  }
}
