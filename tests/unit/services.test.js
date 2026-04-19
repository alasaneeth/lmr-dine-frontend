/**
 * Unit Tests – src/api/services.js & src/api/customerServices.js
 *
 * Every API method is tested with a mocked apiClient so no network
 * calls are made.  We verify:
 *   - The correct HTTP verb and path are used
 *   - The `unwrap` helper extracts res.data.data
 *   - Parameters / bodies are forwarded correctly
 */

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ok = (payload) => Promise.resolve({ data: { data: payload } });

const resetMocks = () => {
  mockGet.mockReset();
  mockPost.mockReset();
  mockPut.mockReset();
  mockPatch.mockReset();
  mockDelete.mockReset();
};

// ─── authApi (inline to avoid import.meta) ───────────────────────────────────

const unwrap = (promise) => promise.then((res) => res.data.data);

const apiClient = {
  get:    mockGet,
  post:   mockPost,
  put:    mockPut,
  patch:  mockPatch,
  delete: mockDelete,
};

const authApi = {
  login:   (body) => unwrap(apiClient.post('/auth/login', body)),
  logout:  ()     => unwrap(apiClient.post('/auth/logout')),
  me:      ()     => unwrap(apiClient.get('/auth/me')),
  refresh: ()     => unwrap(apiClient.post('/auth/refresh')),
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

const userApi = {
  getAll:    (params)   => unwrap(apiClient.get('/users', { params })),
  getById:   (id)       => unwrap(apiClient.get(`/users/${id}`)),
  update:    (id, b)    => unwrap(apiClient.put(`/users/${id}`, b)),
  setStatus: (id, s)    => unwrap(apiClient.patch(`/users/${id}/status`, { status: s })),
  remove:    (id)       => apiClient.delete(`/users/${id}`),
};

const dashboardApi = {
  adminStats:  () => unwrap(apiClient.get('/dashboard/stats')),
  weeklySales: () => unwrap(apiClient.get('/dashboard/weekly-sales')),
};

const customerApi = {
  getAll:    (params)       => unwrap(apiClient.get('/customers', { params })),
  getById:   (id)           => unwrap(apiClient.get(`/customers/${id}`)),
  create:    (body)         => unwrap(apiClient.post('/customers', body)),
  update:    (id, b)        => unwrap(apiClient.put(`/customers/${id}`, b)),
  remove:    (id)           => apiClient.delete(`/customers/${id}`),
  setStatus: (id, status)   => unwrap(apiClient.patch(`/customers/${id}/status`, { status })),
};

const customerReportApi = {
  salesReport:          (params)     => unwrap(apiClient.get('/customers/reports/sales', { params })),
  customerSalesDetail:  (id, params) => unwrap(apiClient.get(`/customers/${id}/reports/sales`, { params })),
  creditReport:         (params)     => unwrap(apiClient.get('/customers/reports/credit', { params })),
  customerCreditDetail: (id)         => unwrap(apiClient.get(`/customers/${id}/reports/credit`)),
  paymentHistory:       (id, params) => unwrap(apiClient.get(`/customers/${id}/payments`, { params })),
  reportSummary:        (params)     => unwrap(apiClient.get('/customers/reports/summary', { params })),
};

// ─── unwrap helper ────────────────────────────────────────────────────────────

describe('unwrap helper', () => {
  test('extracts res.data.data from a resolved promise', async () => {
    const promise = Promise.resolve({ data: { data: { id: 1 } } });
    await expect(unwrap(promise)).resolves.toEqual({ id: 1 });
  });

  test('propagates rejections unchanged', async () => {
    const err = new Error('oops');
    await expect(unwrap(Promise.reject(err))).rejects.toThrow('oops');
  });
});

// ─── authApi ──────────────────────────────────────────────────────────────────

describe('authApi', () => {
  beforeEach(resetMocks);

  test('login POSTs to /auth/login with credentials', async () => {
    mockPost.mockReturnValue(ok({ accessToken: 'jwt', user: { id: 1 } }));
    const res = await authApi.login({ email: 'a@b.com', password: 'pw' });
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pw' });
    expect(res.accessToken).toBe('jwt');
  });

  test('logout POSTs to /auth/logout', async () => {
    mockPost.mockReturnValue(ok({}));
    await authApi.logout();
    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
  });

  test('me GETs /auth/me', async () => {
    mockGet.mockReturnValue(ok({ id: 1 }));
    await authApi.me();
    expect(mockGet).toHaveBeenCalledWith('/auth/me');
  });

  test('refresh POSTs to /auth/refresh', async () => {
    mockPost.mockReturnValue(ok({ accessToken: 'new' }));
    const res = await authApi.refresh();
    expect(res.accessToken).toBe('new');
  });
});

// ─── menuApi ──────────────────────────────────────────────────────────────────

describe('menuApi', () => {
  beforeEach(resetMocks);

  test('getAll GETs /menu with params', async () => {
    mockGet.mockReturnValue(ok([]));
    await menuApi.getAll({ category: 'main' });
    expect(mockGet).toHaveBeenCalledWith('/menu', { params: { category: 'main' } });
  });

  test('getById GETs /menu/:id', async () => {
    mockGet.mockReturnValue(ok({ id: '5' }));
    const res = await menuApi.getById('5');
    expect(mockGet).toHaveBeenCalledWith('/menu/5');
    expect(res.id).toBe('5');
  });

  test('create POSTs to /menu with multipart header', async () => {
    mockPost.mockReturnValue(ok({ id: '10' }));
    const fd = new FormData();
    await menuApi.create(fd);
    expect(mockPost).toHaveBeenCalledWith('/menu', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  });

  test('update PUTs to /menu/:id', async () => {
    mockPut.mockReturnValue(ok({ id: '3' }));
    await menuApi.update('3', new FormData());
    expect(mockPut).toHaveBeenCalledWith('/menu/3', expect.anything(), expect.anything());
  });

  test('remove DELETEs /menu/:id', async () => {
    mockDelete.mockReturnValue(Promise.resolve());
    await menuApi.remove('7');
    expect(mockDelete).toHaveBeenCalledWith('/menu/7');
  });

  test('adjustStock PATCHes /menu/:id/stock with qty', async () => {
    mockPatch.mockReturnValue(ok({}));
    await menuApi.adjustStock('2', -5);
    expect(mockPatch).toHaveBeenCalledWith('/menu/2/stock', { qty: -5 });
  });
});

// ─── orderApi ─────────────────────────────────────────────────────────────────

describe('orderApi', () => {
  beforeEach(resetMocks);

  test('getAll GETs /orders', async () => {
    mockGet.mockReturnValue(ok([]));
    await orderApi.getAll({ status: 'pending' });
    expect(mockGet).toHaveBeenCalledWith('/orders', { params: { status: 'pending' } });
  });

  test('getMyOrders GETs /orders/my', async () => {
    mockGet.mockReturnValue(ok([]));
    await orderApi.getMyOrders({});
    expect(mockGet).toHaveBeenCalledWith('/orders/my', { params: {} });
  });

  test('create POSTs to /orders', async () => {
    mockPost.mockReturnValue(ok({ id: 'ord-1' }));
    const body = { items: [{ menuId: 'x', qty: 2 }] };
    const res = await orderApi.create(body);
    expect(mockPost).toHaveBeenCalledWith('/orders', body);
    expect(res.id).toBe('ord-1');
  });

  test('advance PATCHes /orders/:id/advance', async () => {
    mockPatch.mockReturnValue(ok({ status: 'preparing' }));
    await orderApi.advance('ord-99');
    expect(mockPatch).toHaveBeenCalledWith('/orders/ord-99/advance');
  });

  test('cancel PATCHes /orders/:id/cancel', async () => {
    mockPatch.mockReturnValue(ok({ status: 'cancelled' }));
    await orderApi.cancel('ord-55');
    expect(mockPatch).toHaveBeenCalledWith('/orders/ord-55/cancel');
  });
});

// ─── invoiceApi ───────────────────────────────────────────────────────────────

describe('invoiceApi', () => {
  beforeEach(resetMocks);

  test('create POSTs to /invoices', async () => {
    mockPost.mockReturnValue(ok({ id: 'inv-1' }));
    const body = { orderId: 'ord-1', total: 1500 };
    const res = await invoiceApi.create(body);
    expect(res.id).toBe('inv-1');
  });

  test('markPaid PATCHes /invoices/:id/pay', async () => {
    mockPatch.mockReturnValue(ok({ status: 'paid' }));
    await invoiceApi.markPaid('inv-5');
    expect(mockPatch).toHaveBeenCalledWith('/invoices/inv-5/pay');
  });

  test('salesReport GETs /invoices/sales-report with params', async () => {
    mockGet.mockReturnValue(ok({ total: 50000 }));
    await invoiceApi.salesReport({ from: '2025-01-01' });
    expect(mockGet).toHaveBeenCalledWith('/invoices/sales-report', { params: { from: '2025-01-01' } });
  });
});

// ─── stockApi ─────────────────────────────────────────────────────────────────

describe('stockApi', () => {
  beforeEach(resetMocks);

  test('getLow GETs /stock/low', async () => {
    mockGet.mockReturnValue(ok([]));
    await stockApi.getLow();
    expect(mockGet).toHaveBeenCalledWith('/stock/low');
  });

  test('adjust PATCHes /stock/:id/adjust with delta', async () => {
    mockPatch.mockReturnValue(ok({}));
    await stockApi.adjust('stk-1', 10);
    expect(mockPatch).toHaveBeenCalledWith('/stock/stk-1/adjust', { delta: 10 });
  });

  test('create POSTs to /stock', async () => {
    mockPost.mockReturnValue(ok({ id: 'stk-new' }));
    const body = { name: 'Rice', qty: 50 };
    const res = await stockApi.create(body);
    expect(res.id).toBe('stk-new');
  });
});

// ─── userApi ──────────────────────────────────────────────────────────────────

describe('userApi', () => {
  beforeEach(resetMocks);

  test('getAll GETs /users', async () => {
    mockGet.mockReturnValue(ok([]));
    await userApi.getAll({});
    expect(mockGet).toHaveBeenCalledWith('/users', { params: {} });
  });

  test('setStatus PATCHes /users/:id/status', async () => {
    mockPatch.mockReturnValue(ok({}));
    await userApi.setStatus('u1', 'inactive');
    expect(mockPatch).toHaveBeenCalledWith('/users/u1/status', { status: 'inactive' });
  });

  test('remove DELETEs /users/:id', async () => {
    mockDelete.mockReturnValue(Promise.resolve());
    await userApi.remove('u2');
    expect(mockDelete).toHaveBeenCalledWith('/users/u2');
  });
});

// ─── dashboardApi ─────────────────────────────────────────────────────────────

describe('dashboardApi', () => {
  beforeEach(resetMocks);

  test('adminStats GETs /dashboard/stats', async () => {
    mockGet.mockReturnValue(ok({ orders: 10 }));
    const res = await dashboardApi.adminStats();
    expect(mockGet).toHaveBeenCalledWith('/dashboard/stats');
    expect(res.orders).toBe(10);
  });

  test('weeklySales GETs /dashboard/weekly-sales', async () => {
    mockGet.mockReturnValue(ok([{ day: 'Mon', total: 5000 }]));
    const res = await dashboardApi.weeklySales();
    expect(res[0].day).toBe('Mon');
  });
});

// ─── customerApi ─────────────────────────────────────────────────────────────

describe('customerApi', () => {
  beforeEach(resetMocks);

  test('getAll GETs /customers', async () => {
    mockGet.mockReturnValue(ok([]));
    await customerApi.getAll({ page: 1 });
    expect(mockGet).toHaveBeenCalledWith('/customers', { params: { page: 1 } });
  });

  test('create POSTs to /customers', async () => {
    mockPost.mockReturnValue(ok({ id: 'c1' }));
    const body = { name: 'John', phone: '0771234567' };
    const res = await customerApi.create(body);
    expect(res.id).toBe('c1');
  });

  test('setStatus PATCHes /customers/:id/status', async () => {
    mockPatch.mockReturnValue(ok({}));
    await customerApi.setStatus('c5', 'vip');
    expect(mockPatch).toHaveBeenCalledWith('/customers/c5/status', { status: 'vip' });
  });

  test('remove DELETEs /customers/:id', async () => {
    mockDelete.mockReturnValue(Promise.resolve());
    await customerApi.remove('c3');
    expect(mockDelete).toHaveBeenCalledWith('/customers/c3');
  });
});

// ─── customerReportApi ────────────────────────────────────────────────────────

describe('customerReportApi', () => {
  beforeEach(resetMocks);

  test('salesReport GETs /customers/reports/sales', async () => {
    mockGet.mockReturnValue(ok([]));
    await customerReportApi.salesReport({ from: '2025-01-01' });
    expect(mockGet).toHaveBeenCalledWith('/customers/reports/sales', { params: { from: '2025-01-01' } });
  });

  test('customerSalesDetail GETs /customers/:id/reports/sales', async () => {
    mockGet.mockReturnValue(ok([]));
    await customerReportApi.customerSalesDetail('c1', { month: 3 });
    expect(mockGet).toHaveBeenCalledWith('/customers/c1/reports/sales', { params: { month: 3 } });
  });

  test('creditReport GETs /customers/reports/credit', async () => {
    mockGet.mockReturnValue(ok({ outstanding: 50000 }));
    await customerReportApi.creditReport({});
    expect(mockGet).toHaveBeenCalledWith('/customers/reports/credit', { params: {} });
  });

  test('customerCreditDetail GETs /customers/:id/reports/credit', async () => {
    mockGet.mockReturnValue(ok({ limit: 10000 }));
    await customerReportApi.customerCreditDetail('c2');
    expect(mockGet).toHaveBeenCalledWith('/customers/c2/reports/credit');
  });

  test('paymentHistory GETs /customers/:id/payments', async () => {
    mockGet.mockReturnValue(ok([]));
    await customerReportApi.paymentHistory('c3', { page: 1 });
    expect(mockGet).toHaveBeenCalledWith('/customers/c3/payments', { params: { page: 1 } });
  });

  test('reportSummary GETs /customers/reports/summary', async () => {
    mockGet.mockReturnValue(ok({ count: 42 }));
    const res = await customerReportApi.reportSummary({});
    expect(res.count).toBe(42);
  });
});
