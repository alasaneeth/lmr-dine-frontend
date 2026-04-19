const apiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  create: jest.fn(() => apiClient),
};

module.exports = apiClient;
module.exports.default = apiClient;
module.exports.getAccessToken = jest.fn(() => null);
module.exports.setAccessToken = jest.fn();
module.exports.clearAuth      = jest.fn();
