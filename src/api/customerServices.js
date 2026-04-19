// src/api/customerServices.js
// Customer management and reporting API helpers

import apiClient from './apiClient';

const unwrap = (promise) => promise.then((res) => res.data.data);

// ════════════════════════════════════════════════════════════════════════════
//  Customers API
// ════════════════════════════════════════════════════════════════════════════
export const customerApi = {
  getAll:    (params)  => unwrap(apiClient.get('/customers', { params })),
  getById:   (id)      => unwrap(apiClient.get(`/customers/${id}`)),
  create:    (body)    => unwrap(apiClient.post('/customers', body)),
  update:    (id, b)   => unwrap(apiClient.put(`/customers/${id}`, b)),
  remove:    (id)      => apiClient.delete(`/customers/${id}`),
  setStatus: (id, status) => unwrap(apiClient.patch(`/customers/${id}/status`, { status })),
};

// ════════════════════════════════════════════════════════════════════════════
//  Customer Reports API
// ════════════════════════════════════════════════════════════════════════════
export const customerReportApi = {
  // Customer Sales Report: total purchases per customer with date filtering
  salesReport: (params) => unwrap(apiClient.get('/customers/reports/sales', { params })),

  // Single customer sales detail with transactions
  customerSalesDetail: (customerId, params) =>
    unwrap(apiClient.get(`/customers/${customerId}/reports/sales`, { params })),

  // Credit Report: outstanding balances, credit limits, payment history
  creditReport: (params) => unwrap(apiClient.get('/customers/reports/credit', { params })),

  // Single customer credit detail
  customerCreditDetail: (customerId) =>
    unwrap(apiClient.get(`/customers/${customerId}/reports/credit`)),

  // Payment history for a customer
  paymentHistory: (customerId, params) =>
    unwrap(apiClient.get(`/customers/${customerId}/payments`, { params })),

  // Summary stats for the reports dashboard
  reportSummary: (params) => unwrap(apiClient.get('/customers/reports/summary', { params })),
};
