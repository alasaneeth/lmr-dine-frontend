// src/api/apiClient.js
import axios from 'axios';

// Relative path ('/api/v1') lets Vite's dev proxy and nginx handle routing.
// Override via VITE_API_URL if you need a fully-qualified URL (e.g. testing
// against a remote staging backend from a local machine).
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/**
 * Primary Axios instance.
 * – Attaches Bearer token from localStorage on every request.
 * – On 401, attempts a silent token refresh then retries once.
 * – On second 401 (refresh itself failed), clears auth and redirects to /login.
 */
const apiClient = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,          // send httpOnly refresh cookie
  headers:         { 'Content-Type': 'application/json' },
});

// ── Request interceptor – inject access token ────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor – silent refresh on 401 ────────────────────────────
let isRefreshing    = false;
let failedQueue     = [];

const processQueue  = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        }).catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Token helpers (kept in-module; no raw token in localStorage in prod) ─────
const TOKEN_KEY = 'rms_access_token';

export const getAccessToken  = ()        => localStorage.getItem(TOKEN_KEY);
export const setAccessToken  = (token)   => localStorage.setItem(TOKEN_KEY, token);
export const clearAuth       = ()        => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem('rms_user'); };

export default apiClient;
