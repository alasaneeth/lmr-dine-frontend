require('@testing-library/jest-dom');

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('act(...)')) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });

beforeEach(() => { localStorage.clear(); });
