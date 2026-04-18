// src/hooks/index.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

// ── useApi ────────────────────────────────────────────────────────────────────
/**
 * Generic data-fetching hook.
 * @param {Function} apiFn   – async function returning the data
 * @param {Array}    deps    – dependency array (like useEffect)
 * @param {*}        initial – initial value for data
 */
export function useApi(apiFn, deps = [], initial = null) {
  const [data,    setData]    = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      setData(result);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message || 'Request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}

// ── usePagination ─────────────────────────────────────────────────────────────
/**
 * Pagination state manager.
 */
export function usePagination(initialLimit = 10) {
  const [page,    setPage]   = useState(1);
  const [limit]              = useState(initialLimit);
  const [total,   setTotal]  = useState(0);
  const [search,  setSearch] = useState('');

  const totalPages = Math.ceil(total / limit);

  const goTo      = (p) => setPage(Math.max(1, Math.min(p, totalPages || 1)));
  const nextPage  = ()  => goTo(page + 1);
  const prevPage  = ()  => goTo(page - 1);
  const resetPage = ()  => setPage(1);

  // Reset to page 1 when search changes
  const updateSearch = (q) => { setSearch(q); setPage(1); };

  return { page, limit, total, setTotal, search, updateSearch, goTo, nextPage, prevPage, resetPage, totalPages };
}

// ── useDebounce ───────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── useNotifications ──────────────────────────────────────────────────────────
/**
 * Listens to real-time socket notifications.
 * Returns a stack of recent notifications.
 */
export function useNotifications() {
  const { subscribe, unsubscribe } = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handler = (data) => {
      setNotifications((prev) => [{ ...data, id: Date.now() }, ...prev.slice(0, 19)]);
    };
    subscribe('notification', handler);
    subscribe('order:new',    handler);
    return () => {
      unsubscribe('notification', handler);
      unsubscribe('order:new',    handler);
    };
  }, [subscribe, unsubscribe]);

  const dismiss = (id) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const clear   = ()   => setNotifications([]);

  return { notifications, dismiss, clear };
}

// ── useMutation ──────────────────────────────────────────────────────────────
/**
 * Imperative API call hook (for create/update/delete).
 */
export function useMutation(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      return { success: true, data: result };
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message || 'Request failed';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [apiFn]); // eslint-disable-line react-hooks/exhaustive-deps

  return { mutate, loading, error };
}
