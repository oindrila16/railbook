import api from './api';

export async function register({ email, password, fullName }) {
  const { data } = await api.post('/auth/register', { email, password, fullName });
  return data.data;
}

export async function verifyOtp({ email, otp }) {
  const { data } = await api.post('/auth/verify-otp', { email, otp });
  return data.data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data;
}
