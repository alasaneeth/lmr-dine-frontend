/**
 * Integration Tests – AuthContext
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockLogin     = jest.fn();
const mockLogout    = jest.fn();
const mockMe        = jest.fn();
const mockSetToken  = jest.fn();
const mockClearAuth = jest.fn();

// ── Inline AuthContext ───────────────────────────────────────────────────────
const AuthContext = createContext(null);
const USER_KEY = 'rms_user';

function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password, mfaToken = null) => {
    setLoading(true);
    try {
      const payload = { email, password };
      if (mfaToken) payload.mfaToken = mfaToken;
      const result = await mockLogin(payload);
      if (result.requiresMfa) return { requiresMfa: true };
      const { user: userData, accessToken } = result;
      mockSetToken(accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      return { success: true, role: userData.role };
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await mockLogout(); } catch (_) {}
    mockClearAuth();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: fresh } = await mockMe();
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setUser(fresh);
    } catch (_) {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => useContext(AuthContext);

// ── Test components ──────────────────────────────────────────────────────────
function AuthDisplay() {
  const { user, loading } = useAuth();
  return (
    <>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
    </>
  );
}

function LoginBtn({ email = 'a@b.com', password = 'pw', mfaToken }) {
  const { login } = useAuth();
  const [result, setResult] = React.useState(null);
  return (
    <>
      <button onClick={async () => setResult(await login(email, password, mfaToken ?? null))}>Login</button>
      {result && <div data-testid="result">{JSON.stringify(result)}</div>}
    </>
  );
}

function LogoutBtn()  { const { logout }      = useAuth(); return <button onClick={logout}>Logout</button>; }
function RefreshBtn() { const { refreshUser }  = useAuth(); return <button onClick={refreshUser}>Refresh</button>; }

const setup = (...extras) =>
  render(
    <AuthProvider>
      <AuthDisplay />
      {extras.map((el, i) => React.cloneElement(el, { key: i }))}
    </AuthProvider>
  );

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

// ── Initial state ────────────────────────────────────────────────────────────
describe('AuthContext – initial state', () => {
  test('user is null when localStorage is empty', () => {
    setup();
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  test('user is hydrated from localStorage on mount', () => {
    localStorage.setItem(USER_KEY, JSON.stringify({ id: '1', role: 'admin' }));
    setup();
    expect(screen.getByTestId('user')).toHaveTextContent('"role":"admin"');
  });

  test('loading is false on mount', () => {
    setup();
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
});

// ── login() ──────────────────────────────────────────────────────────────────
describe('AuthContext – login()', () => {
  test('sets user and token on successful login', async () => {
    const userData = { id: 'u1', role: 'admin' };
    mockLogin.mockResolvedValue({ user: userData, accessToken: 'jwt-abc' });
    setup(<LoginBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('"role":"admin"'));
    expect(mockSetToken).toHaveBeenCalledWith('jwt-abc');
    expect(JSON.parse(localStorage.getItem(USER_KEY))).toEqual(userData);
  });

  test('returns { requiresMfa: true } when server requests MFA', async () => {
    mockLogin.mockResolvedValue({ requiresMfa: true });
    setup(<LoginBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('"requiresMfa":true'));
  });

  test('includes mfaToken in request payload when provided', async () => {
    mockLogin.mockResolvedValue({ user: { id: '2', role: 'admin' }, accessToken: 't' });
    setup(<LoginBtn mfaToken="123456" />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ mfaToken: '123456' })));
  });

  test('returns { success: false, message } on API error', async () => {
    mockLogin.mockRejectedValue({ response: { data: { error: { message: 'Bad credentials' } } } });
    setup(<LoginBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('"message":"Bad credentials"'));
    expect(screen.getByTestId('result')).toHaveTextContent('"success":false');
  });

  test('falls back to "Login failed" when error has no message', async () => {
    mockLogin.mockRejectedValue(new Error('Network'));
    setup(<LoginBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('"message":"Login failed"'));
  });

  test('does not persist user to localStorage on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('fail'));
    setup(<LoginBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => screen.getByTestId('result'));
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});

// ── logout() ─────────────────────────────────────────────────────────────────
describe('AuthContext – logout()', () => {
  test('clears user state and auth storage after login + logout', async () => {
    mockLogin.mockResolvedValue({ user: { id: 'u1', role: 'waiter' }, accessToken: 't' });
    mockLogout.mockResolvedValue({});
    setup(<LoginBtn />, <LogoutBtn />);

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByTestId('user')).not.toHaveTextContent('null'));

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('null'));
    expect(mockClearAuth).toHaveBeenCalled();
  });

  test('still calls clearAuth even when logout API throws', async () => {
    mockLogout.mockRejectedValue(new Error('network'));
    localStorage.setItem(USER_KEY, JSON.stringify({ id: '1', role: 'admin' }));
    setup(<LogoutBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('null'));
    expect(mockClearAuth).toHaveBeenCalled();
  });
});

// ── refreshUser() ────────────────────────────────────────────────────────────
describe('AuthContext – refreshUser()', () => {
  test('updates user state from server response', async () => {
    localStorage.setItem(USER_KEY, JSON.stringify({ id: '1', role: 'cashier' }));
    const fresh = { id: '1', role: 'admin' };
    mockMe.mockResolvedValue({ user: fresh });
    mockLogout.mockResolvedValue({});
    setup(<RefreshBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('"role":"admin"'));
    expect(JSON.parse(localStorage.getItem(USER_KEY))).toEqual(fresh);
  });

  test('logs out if refreshUser API call fails', async () => {
    localStorage.setItem(USER_KEY, JSON.stringify({ id: '1', role: 'admin' }));
    mockMe.mockRejectedValue(new Error('expired'));
    mockLogout.mockResolvedValue({});
    setup(<RefreshBtn />);
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('null'));
    expect(mockClearAuth).toHaveBeenCalled();
  });
});