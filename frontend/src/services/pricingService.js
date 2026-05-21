import api from './api';

export async function getFareMatrix({ days = 7, fromDate } = {}) {
  const { data } = await api.get('/pricing/matrix', {
    params: { days, fromDate },
  });
  return data.data;
}

export async function getFareClasses() {
  const { data } = await api.get('/pricing/fare-classes');
  return data.data.fareClasses;
}

export async function getPriceQuote({ routeId, travelDate, passengers = 1, fareClass }) {
  const { data } = await api.get('/pricing/quote', {
    params: {
      routeId,
      date: travelDate,
      passengers,
      fareClass: fareClass || 'economy',
    },
  });
  return data.data;
}
