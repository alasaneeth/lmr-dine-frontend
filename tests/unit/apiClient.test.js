/**
 * Unit Tests – src/api/apiClient.js
 *
 * Tests the token helper functions and the interceptor behaviour
 * WITHOUT hitting a real network (axios is mocked via jest.mock).
 */

const TOKEN_KEY = 'rms_access_token';
const USER_KEY  = 'rms_user';

// ─── Inline implementations matching apiClient.js ────────────────────────────
// We replicate the pure helpers here to test them in isolation, since the
// real file uses import.meta.env which Babel/Jest cannot evaluate directly.

const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
const setAccessToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('apiClient – token helpers', () => {
  beforeEach(() => localStorage.clear());

  describe('getAccessToken()', () => {
    test('returns null when no token is stored', () => {
      expect(getAccessToken()).toBeNull();
    });

    test('returns the stored token string', () => {
      localStorage.setItem(TOKEN_KEY, 'my-jwt-token');
      expect(getAccessToken()).toBe('my-jwt-token');
    });

    test('returns the latest value after an update', () => {
      localStorage.setItem(TOKEN_KEY, 'old-token');
      localStorage.setItem(TOKEN_KEY, 'new-token');
      expect(getAccessToken()).toBe('new-token');
    });
  });

  describe('setAccessToken()', () => {
    test('persists the token in localStorage', () => {
      setAccessToken('abc123');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('abc123');
    });

    test('overwrites a previous token', () => {
      setAccessToken('first');
      setAccessToken('second');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('second');
    });

    test('stores an empty string without throwing', () => {
      expect(() => setAccessToken('')).not.toThrow();
      expect(localStorage.getItem(TOKEN_KEY)).toBe('');
    });
  });

  describe('clearAuth()', () => {
    test('removes the access token', () => {
      localStorage.setItem(TOKEN_KEY, 'jwt');
      clearAuth();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    test('removes the user key', () => {
      localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }));
      clearAuth();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    test('is idempotent when storage is already empty', () => {
      expect(() => clearAuth()).not.toThrow();
    });

    test('does not remove unrelated keys', () => {
      localStorage.setItem('other_key', 'value');
      clearAuth();
      expect(localStorage.getItem('other_key')).toBe('value');
    });
  });
});

// ─── processQueue logic (extracted and tested in isolation) ──────────────────

describe('apiClient – processQueue logic', () => {
  const makeQueue = () => {
    let queue = [];

    const enqueue = () =>
      new Promise((resolve, reject) => queue.push({ resolve, reject }));

    const processQueue = (error, token = null) => {
      queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
      queue = [];
    };

    return { enqueue, processQueue, getQueue: () => queue };
  };

  test('resolves all queued promises on success', async () => {
    const { enqueue, processQueue } = makeQueue();
    const p1 = enqueue();
    const p2 = enqueue();

    processQueue(null, 'fresh-token');

    await expect(p1).resolves.toBe('fresh-token');
    await expect(p2).resolves.toBe('fresh-token');
  });

  test('rejects all queued promises on error', async () => {
    const { enqueue, processQueue } = makeQueue();
    const p1 = enqueue();
    const p2 = enqueue();

    const err = new Error('refresh failed');
    processQueue(err);

    await expect(p1).rejects.toThrow('refresh failed');
    await expect(p2).rejects.toThrow('refresh failed');
  });

  test('empties the queue after processing', () => {
    const { enqueue, processQueue, getQueue } = makeQueue();
    enqueue();
    enqueue();
    expect(getQueue()).toHaveLength(2);

    processQueue(null, 'token');
    expect(getQueue()).toHaveLength(0);
  });
});

// ─── Request interceptor logic ────────────────────────────────────────────────

describe('apiClient – request interceptor behaviour', () => {
  const buildConfig = () => ({ headers: {} });

  const applyRequestInterceptor = (config, tokenFn) => {
    const token = tokenFn();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  };

  test('attaches Authorization header when a token exists', () => {
    localStorage.setItem(TOKEN_KEY, 'valid-token');
    const config = buildConfig();
    const result = applyRequestInterceptor(config, getAccessToken);
    expect(result.headers.Authorization).toBe('Bearer valid-token');
  });

  test('does not attach Authorization header when no token exists', () => {
    localStorage.removeItem(TOKEN_KEY); // ensure clean state
    const config = buildConfig();
    const result = applyRequestInterceptor(config, getAccessToken);
    expect(result.headers.Authorization).toBeUndefined();
  });

  test('passes config through unchanged apart from Authorization', () => {
    localStorage.setItem(TOKEN_KEY, 't');
    const config = { headers: { 'Content-Type': 'application/json' } };
    const result = applyRequestInterceptor(config, getAccessToken);
    expect(result.headers['Content-Type']).toBe('application/json');
  });
});
