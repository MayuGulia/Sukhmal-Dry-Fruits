import axios from 'axios';

const BASE = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
export const API_BASE = BASE ? `${BASE}/api` : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};
