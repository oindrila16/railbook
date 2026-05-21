import api from './api';

export async function getStats() {
  const { data } = await api.get('/admin/stats');
  return data.data;
}

export async function getUsers(limit = 100) {
  const { data } = await api.get('/admin/users', { params: { limit } });
  return data.data;
}

export async function getBookings(limit = 50) {
  const { data } = await api.get('/admin/bookings', { params: { limit } });
  return data.data;
}

export async function getTrains() {
  const { data } = await api.get('/admin/trains');
  return data.data;
}

export async function updateTrain(trainId, payload) {
  const { data } = await api.patch(`/admin/trains/${trainId}`, payload);
  return data.data;
}

export async function getRoutes() {
  const { data } = await api.get('/admin/routes');
  return data.data;
}

export async function updateRoute(routeId, payload) {
  const { data } = await api.patch(`/admin/routes/${routeId}`, payload);
  return data.data;
}
