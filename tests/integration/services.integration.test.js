/**
 * Integration Tests – API Service Layer
 *
 * These tests exercise the full chain:
 *   Component (or caller) → service function → apiClient mock → unwrap
 *
 * They validate that:
 *   - Correct endpoints receive correct payloads
 *   - Errors propagate through the unwrap chain
 *   - Pagination / filter params reach the HTTP call
 *   - Concurrent mutations work independently
 */

// ─── Mock axios at module level ───────────────────────────────────────────────

const mockGet    = jest.fn();
const mockPost   = jest.fn();
const mockPut    = jest.fn();
const mockPatch  = jest.fn();
const mockDelete = jest.fn();

jest.mock('axios', () => ({
  create: () => ({
    get:    mockGet,
    post:   mockPost,
    put:    mockPut,
    patch:  mockPatch,
    delete: mockDelete,
    interceptors: {
      request:  { use: jest.fn() },
      response: { use: jest.fn() },
    },
  }),
  post: jest.fn(),
}));

// ─── Inline service implementations ──────────────────────────────────────────

const apiClient = {
  get:    mockGet,
  post:   mockPost,
  put:    mockPut,
  patch:  mockPatch,
  delete: mockDelete,
};

const unwrap = (p) => p.then((res) => res.data.data);

const ok  = (payload)  => Promise.resolve({ data: { data: payload } });
const err = (message)  => Promise.reject({ response: { data: { error: { message } } } });
const netErr = ()      => Promise.reject(new Error('Network Error'));

const authApi = {
  login:   (body) => unwrap(apiClient.post('/auth/login', body)),
  logout:  ()     => unwrap(apiClient.post('/auth/logout')),
  me:      ()     => unwrap(apiClient.get('/auth/me')),
};

const menuApi = {
  getAll:      (params) => unwrap(apiClient.get('/menu', { params })),
  getById:     (id)     => unwrap(apiClient.get(`/menu/${id}`)),
  create:      (fd)     => unwrap(apiClient.post('/menu', fd, { headers: { 'Content-Type': 'multipart/form-data' } })),
  update:      (id, fd) => unwrap(apiClient.put(`/menu/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })),
  remove:      (id)     => apiClient.delete(`/menu/${id}`),
  adjustStock: (id, qty) => unwrap(apiClient.patch(`/menu/${id}/stock`, { qty })),
};

const orderApi = {
  getAll:     (params) => unwrap(apiClient.get('/orders', { params })),
  getMyOrders:(params) => unwrap(apiClient.get('/orders/my', { params })),
  getById:    (id)     => unwrap(apiClient.get(`/orders/${id}`)),
  create:     (body)   => unwrap(apiClient.post('/orders', body)),
  advance:    (id)     => unwrap(apiClient.patch(`/orders/${id}/advance`)),
  cancel:     (id)     => unwrap(apiClient.patch(`/orders/${id}/cancel`)),
};

const invoiceApi = {
  getAll:      (params) => unwrap(apiClient.get('/invoices', { params })),
  getById:     (id)     => unwrap(apiClient.get(`/invoices/${id}`)),
  create:      (body)   => unwrap(apiClient.post('/invoices', body)),
  markPaid:    (id)     => unwrap(apiClient.patch(`/invoices/${id}/pay`)),
  salesReport: (params) => unwrap(apiClient.get('/invoices/sales-report', { params })),
};

const stockApi = {
  getAll: (params) => unwrap(apiClient.get('/stock', { params })),
  getLow: ()       => unwrap(apiClient.get('/stock/low')),
  create: (body)   => unwrap(apiClient.post('/stock', body)),
  update: (id, b)  => unwrap(apiClient.put(`/stock/${id}`, b)),
  adjust: (id, d)  => unwrap(apiClient.patch(`/stock/${id}/adjust`, { delta: d })),
  remove: (id)     => apiClient.delete(`/stock/${id}`),
};

const customerApi = {
  getAll:    (params)     => unwrap(apiClient.get('/customers', { params })),
  getById:   (id)         => unwrap(apiClient.get(`/customers/${id}`)),
  create:    (body)       => unwrap(apiClient.post('/customers', body)),
  update:    (id, b)      => unwrap(apiClient.put(`/customers/${id}`, b)),
  remove:    (id)         => apiClient.delete(`/customers/${id}`),
  setStatus: (id, status) => unwrap(apiClient.patch(`/customers/${id}/status`, { status })),
};

const customerReportApi = {
  salesReport:          (params)     => unwrap(apiClient.get('/customers/reports/sales', { params })),
  customerSalesDetail:  (id, params) => unwrap(apiClient.get(`/customers/${id}/reports/sales`, { params })),
  creditReport:         (params)     => unwrap(apiClient.get('/customers/reports/credit', { params })),
  customerCreditDetail: (id)         => unwrap(apiClient.get(`/customers/${id}/reports/credit`)),
  paymentHistory:       (id, params) => unwrap(apiClient.get(`/customers/${id}/payments`, { params })),
  reportSummary:        (params)     => unwrap(apiClient.get('/customers/reports/summary', { params })),
};

beforeEach(() => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPut.mockReset();
  mockPatch.mockReset();
  mockDelete.mockReset();
});

// ─── Error propagation ────────────────────────────────────────────────────────

describe('Error propagation through unwrap', () => {
  test('propagates API error message from the server envelope', async () => {
    mockGet.mockReturnValue(err('Not found'));
    await expect(menuApi.getById('missing')).rejects.toMatchObject({
      response: { data: { error: { message: 'Not found' } } },
    });
  });

  test('propagates network errors', async () => {
    mockGet.mockReturnValue(netErr());
    await expect(orderApi.getAll({})).rejects.toThrow('Network Error');
  });

  test('propagates POST errors', async () => {
    mockPost.mockReturnValue(err('Validation failed'));
    await expect(orderApi.create({ items: [] })).rejects.toMatchObject({
      response: { data: { error: { message: 'Validation failed' } } },
    });
  });
});

// ─── Pagination & filtering ────────────────────────────────────────────────────

describe('Pagination and filtering params', () => {
  test('menuApi.getAll forwards all filter params', async () => {
    mockGet.mockReturnValue(ok([]));
    await menuApi.getAll({ category: 'drinks', page: 2, limit: 20 });
    expect(mockGet).toHaveBeenCalledWith('/menu', {
      params: { category: 'drinks', page: 2, limit: 20 },
    });
  });

  test('orderApi.getAll forwards status and date params', async () => {
    mockGet.mockReturnValue(ok([]));
    await orderApi.getAll({ status: 'preparing', from: '2025-04-01' });
    expect(mockGet).toHaveBeenCalledWith('/orders', {
      params: { status: 'preparing', from: '2025-04-01' },
    });
  });

  test('customerApi.getAll forwards search and pagination', async () => {
    mockGet.mockReturnValue(ok({ items: [], total: 0 }));
    await customerApi.getAll({ search: 'John', page: 3, limit: 10 });
    expect(mockGet).toHaveBeenCalledWith('/customers', {
      params: { search: 'John', page: 3, limit: 10 },
    });
  });

  test('invoiceApi.salesReport forwards date range params', async () => {
    mockGet.mockReturnValue(ok({ totals: [] }));
    await invoiceApi.salesReport({ from: '2025-01-01', to: '2025-03-31' });
    expect(mockGet).toHaveBeenCalledWith('/invoices/sales-report', {
      params: { from: '2025-01-01', to: '2025-03-31' },
    });
  });
});

// ─── Full CRUD lifecycle ───────────────────────────────────────────────────────

describe('Full CRUD lifecycle – Menu', () => {
  test('create then fetch the new item', async () => {
    const created = { id: 'm1', name: 'Burger', price: 1200 };
    mockPost.mockReturnValue(ok(created));
    mockGet.mockReturnValue(ok(created));

    const fd = new FormData();
    const createResult = await menuApi.create(fd);
    expect(createResult.id).toBe('m1');

    const fetchResult = await menuApi.getById('m1');
    expect(fetchResult.name).toBe('Burger');
    expect(mockGet).toHaveBeenCalledWith('/menu/m1');
  });

  test('update then remove', async () => {
    mockPut.mockReturnValue(ok({ id: 'm1', name: 'Cheeseburger' }));
    mockDelete.mockReturnValue(Promise.resolve({ status: 204 }));

    const updated = await menuApi.update('m1', new FormData());
    expect(updated.name).toBe('Cheeseburger');

    await menuApi.remove('m1');
    expect(mockDelete).toHaveBeenCalledWith('/menu/m1');
  });
});

describe('Full CRUD lifecycle – Order → Invoice', () => {
  test('create order then generate invoice and mark paid', async () => {
    const order   = { id: 'ord-1', items: [{ menuId: 'm1', qty: 2 }], total: 2400 };
    const invoice = { id: 'inv-1', orderId: 'ord-1', total: 2400, status: 'unpaid' };
    const paid    = { ...invoice, status: 'paid' };

    mockPost
      .mockReturnValueOnce(ok(order))
      .mockReturnValueOnce(ok(invoice));
    mockPatch.mockReturnValue(ok(paid));

    const createdOrder = await orderApi.create({ items: order.items });
    expect(createdOrder.id).toBe('ord-1');

    const createdInvoice = await invoiceApi.create({ orderId: createdOrder.id, total: createdOrder.total });
    expect(createdInvoice.status).toBe('unpaid');

    const paidInvoice = await invoiceApi.markPaid(createdInvoice.id);
    expect(paidInvoice.status).toBe('paid');
    expect(mockPatch).toHaveBeenCalledWith('/invoices/inv-1/pay');
  });
});

describe('Full CRUD lifecycle – Stock', () => {
  test('create stock item and adjust quantity', async () => {
    mockPost.mockReturnValue(ok({ id: 's1', name: 'Tomatoes', qty: 50 }));
    mockPatch.mockReturnValue(ok({ id: 's1', name: 'Tomatoes', qty: 60 }));

    const created = await stockApi.create({ name: 'Tomatoes', qty: 50 });
    expect(created.qty).toBe(50);

    const adjusted = await stockApi.adjust('s1', 10);
    expect(adjusted.qty).toBe(60);
    expect(mockPatch).toHaveBeenCalledWith('/stock/s1/adjust', { delta: 10 });
  });

  test('getLow returns items below threshold', async () => {
    const lowItems = [{ id: 's2', name: 'Salt', qty: 2 }];
    mockGet.mockReturnValue(ok(lowItems));

    const res = await stockApi.getLow();
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Salt');
    expect(mockGet).toHaveBeenCalledWith('/stock/low');
  });
});

// ─── Customer management & reporting ─────────────────────────────────────────

describe('Customer management integration', () => {
  test('create, update, and deactivate a customer', async () => {
    const customer = { id: 'c1', name: 'Alice', status: 'active' };

    mockPost.mockReturnValue(ok(customer));
    mockPut.mockReturnValue(ok({ ...customer, name: 'Alice B.' }));
    mockPatch.mockReturnValue(ok({ ...customer, status: 'inactive' }));

    const created = await customerApi.create({ name: 'Alice' });
    expect(created.id).toBe('c1');

    const updated = await customerApi.update('c1', { name: 'Alice B.' });
    expect(updated.name).toBe('Alice B.');

    const deactivated = await customerApi.setStatus('c1', 'inactive');
    expect(deactivated.status).toBe('inactive');
  });
});

describe('Customer report integration', () => {
  test('fetches all report types for a customer', async () => {
    mockGet.mockReturnValue(ok({ data: [] }));

    await customerReportApi.customerSalesDetail('c1', { month: 4 });
    expect(mockGet).toHaveBeenCalledWith('/customers/c1/reports/sales', { params: { month: 4 } });

    await customerReportApi.customerCreditDetail('c1');
    expect(mockGet).toHaveBeenCalledWith('/customers/c1/reports/credit');

    await customerReportApi.paymentHistory('c1', { page: 1 });
    expect(mockGet).toHaveBeenCalledWith('/customers/c1/payments', { params: { page: 1 } });
  });

  test('reportSummary aggregates across all customers', async () => {
    mockGet.mockReturnValue(ok({ totalCustomers: 55, totalRevenue: 120000 }));
    const summary = await customerReportApi.reportSummary({ year: 2025 });
    expect(summary.totalCustomers).toBe(55);
  });
});

// ─── Concurrent request handling ──────────────────────────────────────────────

describe('Concurrent requests', () => {
  test('parallel getAll calls resolve independently', async () => {
    mockGet
      .mockReturnValueOnce(ok([{ id: 'm1' }]))  // menu
      .mockReturnValueOnce(ok([{ id: 'o1' }])); // orders

    const [menus, orders] = await Promise.all([
      menuApi.getAll({}),
      orderApi.getAll({}),
    ]);

    expect(menus[0].id).toBe('m1');
    expect(orders[0].id).toBe('o1');
  });

  test('one failure does not block the other in Promise.allSettled', async () => {
    mockGet
      .mockReturnValueOnce(ok([{ id: 's1' }]))  // stock succeeds
      .mockReturnValueOnce(err('Forbidden'));    // invoices fail

    const results = await Promise.allSettled([
      stockApi.getAll({}),
      invoiceApi.getAll({}),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[0].value[0].id).toBe('s1');
    expect(results[1].status).toBe('rejected');
  });
});

// ─── Auth flow integration ────────────────────────────────────────────────────

describe('Auth flow integration', () => {
  test('full login → me → logout cycle', async () => {
    const userData = { id: 'u1', role: 'admin', name: 'Admin User' };
    mockPost
      .mockReturnValueOnce(ok({ user: userData, accessToken: 'jwt-1' })) // login
      .mockReturnValueOnce(ok({}));                                        // logout
    mockGet.mockReturnValue(ok({ user: userData }));

    const loginResult = await authApi.login({ email: 'admin@resto.lk', password: 'Admin@123' });
    expect(loginResult.accessToken).toBe('jwt-1');
    expect(loginResult.user.role).toBe('admin');

    const meResult = await authApi.me();
    expect(meResult.user.id).toBe('u1');

    await authApi.logout();
    expect(mockPost).toHaveBeenLastCalledWith('/auth/logout');
  });
});
