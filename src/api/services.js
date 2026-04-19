// src/api/services.js
// Domain-specific API helpers that wrap apiClient.
// Each function returns the `data` payload from the response envelope.

import apiClient from './apiClient';

// ── Helper ────────────────────────────────────────────────────────────────────
const unwrap = (promise) => promise.then((res) => res.data.data);

// ════════════════════════════════════════════════════════════════════════════
//  Auth API
// ════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login:      (body)  => unwrap(apiClient.post('/auth/login', body)),
  register:   (body)  => unwrap(apiClient.post('/auth/register', body)),
  refresh:    ()      => unwrap(apiClient.post('/auth/refresh')),
  logout:     ()      => unwrap(apiClient.post('/auth/logout')),
  me:         ()      => unwrap(apiClient.get('/auth/me')),
  setupMfa:   ()      => unwrap(apiClient.get('/auth/mfa/setup')),
  enableMfa:  (body)  => unwrap(apiClient.post('/auth/mfa/enable', body)),
  disableMfa: ()      => unwrap(apiClient.post('/auth/mfa/disable')),
};

// ════════════════════════════════════════════════════════════════════════════
//  Menu API
// ════════════════════════════════════════════════════════════════════════════
export const menuApi = {
  getAll:      (params) => unwrap(apiClient.get('/menu', { params })),
  getById:     (id)     => unwrap(apiClient.get(`/menu/${id}`)),
  create:      (formData) => unwrap(apiClient.post('/menu', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })),
  update:      (id, formData) => unwrap(apiClient.put(`/menu/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })),
  remove:      (id)     => apiClient.delete(`/menu/${id}`),
  adjustStock: (id, qty) => unwrap(apiClient.patch(`/menu/${id}/stock`, { qty })),
};

// ════════════════════════════════════════════════════════════════════════════
//  Orders API
// ════════════════════════════════════════════════════════════════════════════
export const orderApi = {
  getAll:    (params)  => unwrap(apiClient.get('/orders', { params })),
  getMyOrders: (params) => unwrap(apiClient.get('/orders/my', { params })),
  getById:   (id)      => unwrap(apiClient.get(`/orders/${id}`)),
  create:    (body)    => unwrap(apiClient.post('/orders', body)),
  advance:   (id)      => unwrap(apiClient.patch(`/orders/${id}/advance`)),
  cancel:    (id)      => unwrap(apiClient.patch(`/orders/${id}/cancel`)),
};

// ════════════════════════════════════════════════════════════════════════════
//  Invoices API
// ════════════════════════════════════════════════════════════════════════════
export const invoiceApi = {
  getAll:      (params) => unwrap(apiClient.get('/invoices', { params })),
  getById:     (id)     => unwrap(apiClient.get(`/invoices/${id}`)),
  create:      (body)   => unwrap(apiClient.post('/invoices', body)),
  markPaid:    (id)     => unwrap(apiClient.patch(`/invoices/${id}/pay`)),
  salesReport: (params) => unwrap(apiClient.get('/invoices/sales-report', { params })),
};

// ════════════════════════════════════════════════════════════════════════════
//  Stock API
// ════════════════════════════════════════════════════════════════════════════
export const stockApi = {
  getAll:    (params) => unwrap(apiClient.get('/stock', { params })),
  getLow:    ()       => unwrap(apiClient.get('/stock/low')),
  create:    (body)   => unwrap(apiClient.post('/stock', body)),
  update:    (id, b)  => unwrap(apiClient.put(`/stock/${id}`, b)),
  adjust:    (id, delta) => unwrap(apiClient.patch(`/stock/${id}/adjust`, { delta })),
  remove:    (id)     => apiClient.delete(`/stock/${id}`),
};

// ════════════════════════════════════════════════════════════════════════════
//  Users API
// ════════════════════════════════════════════════════════════════════════════
export const userApi = {
  getAll:    (params)  => unwrap(apiClient.get('/users', { params })),
  getById:   (id)      => unwrap(apiClient.get(`/users/${id}`)),
  update:    (id, b)   => unwrap(apiClient.put(`/users/${id}`, b)),
  setStatus: (id, status) => unwrap(apiClient.patch(`/users/${id}/status`, { status })),
  remove:    (id)      => apiClient.delete(`/users/${id}`),
};

// ════════════════════════════════════════════════════════════════════════════
//  Dashboard API
// ════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  adminStats:  () => unwrap(apiClient.get('/dashboard/stats')),
  weeklySales: () => unwrap(apiClient.get('/dashboard/weekly-sales')),
};

// ════════════════════════════════════════════════════════════════════════════
//  Customers API  (re-exported from customerServices for convenience)
// ════════════════════════════════════════════════════════════════════════════
export { customerApi, customerReportApi } from './customerServices';
