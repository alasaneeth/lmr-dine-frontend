// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { authApi }  from '../api/services';
import { setAccessToken, clearAuth } from '../api/apiClient';

const AuthContext = createContext(null);

const USER_KEY = 'rms_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password, mfaToken = null) => {
    setLoading(true);
    try {
      const payload = { email, password };
      if (mfaToken) payload.mfaToken = mfaToken;

      const result = await authApi.login(payload);

      // Server returned MFA challenge
      if (result.requiresMfa) return { requiresMfa: true };

      const { user: userData, accessToken } = result;
      setAccessToken(accessToken);
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

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) { /* ignore */ }
    clearAuth();
    setUser(null);
  }, []);

  // ── Refresh user profile from server ──────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const { user: fresh } = await authApi.me();
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

export const useAuth = () => useContext(AuthContext);
