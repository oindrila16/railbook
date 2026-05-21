/**
 * Axios instance — attaches JWT and handles API errors.
 */
import axios from 'axios';
import { getToken, clearAuth } from '../utils/auth';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject({ message, errors: error.response?.data?.errors, status: error.response?.status });
  }
);

export default api;
