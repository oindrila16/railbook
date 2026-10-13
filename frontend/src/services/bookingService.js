import api from './api';

export async function createBooking({ routeId, travelDate, passengers, fareClass }) {
  const { data } = await api.post('/bookings', {
    routeId,
    travelDate,
    passengers,
    fareClass: fareClass || 'economy',
  });
  return data.data;
}

export async function getUserBookings() {
  const { data } = await api.get('/bookings/user');
  return data.data;
}

export async function cancelBooking(bookingId) {
  const { data } = await api.delete(`/bookings/${bookingId}`);
  return data.data;
}

export async function getWaitlistStatus() {
  const { data } = await api.get('/waitlist/status');
  return data.data;
}

export async function leaveWaitlist(id) {
  const { data } = await api.delete(`/waitlist/${id}`);
  return data.data;
}
