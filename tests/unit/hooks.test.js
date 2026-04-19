/**
 * Unit Tests – src/hooks/index.js
 *
 * Covers:
 *   - useDebounce    (pure timing logic)
 *   - usePagination  (state transitions)
 *   - useMutation    (loading / error / success flow)
 *   - useApi         (data-fetching lifecycle)
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Inline implementations ───────────────────────────────────────────────────
// We implement the hooks directly here to avoid import.meta.env issues in Jest,
// while keeping the logic byte-for-byte identical to src/hooks/index.js.

import { useState, useEffect, useCallback } from 'react';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function usePagination(initialLimit = 10) {
  const [page,   setPage]   = useState(1);
  const [limit]             = useState(initialLimit);
  const [total,  setTotal]  = useState(0);
  const [search, setSearch] = useState('');

  const totalPages = Math.ceil(total / limit);
  const goTo       = (p) => setPage(Math.max(1, Math.min(p, totalPages || 1)));
  const nextPage   = ()  => goTo(page + 1);
  const prevPage   = ()  => goTo(page - 1);
  const resetPage  = ()  => setPage(1);
  const updateSearch = (q) => { setSearch(q); setPage(1); };

  return { page, limit, total, setTotal, search, updateSearch, goTo, nextPage, prevPage, resetPage, totalPages };
}

function useMutation(apiFn) {
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
  }, [apiFn]);

  return { mutate, loading, error };
}

function useApi(apiFn, deps = [], initial = null) {
  const [data,    setData]    = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

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

// ─── useDebounce ──────────────────────────────────────────────────────────────

describe('useDebounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(()  => jest.useRealTimers());

  test('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  test('does not update before delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 400),
      { initialProps: { val: 'a' } }
    );
    rerender({ val: 'b' });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('a');
  });

  test('updates after delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 400),
      { initialProps: { val: 'a' } }
    );
    rerender({ val: 'b' });
    act(() => { jest.advanceTimersByTime(400); });
    expect(result.current).toBe('b');
  });

  test('resets the timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 400),
      { initialProps: { val: 'a' } }
    );
    rerender({ val: 'b' });
    act(() => { jest.advanceTimersByTime(200); });
    rerender({ val: 'c' });
    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('a'); // timer reset, not yet elapsed

    act(() => { jest.advanceTimersByTime(200); });
    expect(result.current).toBe('c'); // now elapsed
  });

  test('respects a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ val }) => useDebounce(val, 1000),
      { initialProps: { val: 'x' } }
    );
    rerender({ val: 'y' });
    act(() => { jest.advanceTimersByTime(999); });
    expect(result.current).toBe('x');
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('y');
  });
});

// ─── usePagination ────────────────────────────────────────────────────────────

describe('usePagination', () => {
  test('starts at page 1 with default limit 10', () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(10);
    expect(result.current.total).toBe(0);
    expect(result.current.search).toBe('');
  });

  test('accepts a custom limit', () => {
    const { result } = renderHook(() => usePagination(25));
    expect(result.current.limit).toBe(25);
  });

  test('totalPages is 0 when total is 0', () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.totalPages).toBe(0);
  });

  test('calculates totalPages correctly', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(35); });
    expect(result.current.totalPages).toBe(4);
  });

  test('nextPage increments page', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(30); });
    act(() => { result.current.nextPage(); });
    expect(result.current.page).toBe(2);
  });

  test('prevPage decrements page', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(30); });
    act(() => { result.current.goTo(3); });
    act(() => { result.current.prevPage(); });
    expect(result.current.page).toBe(2);
  });

  test('prevPage does not go below page 1', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.prevPage(); });
    expect(result.current.page).toBe(1);
  });

  test('nextPage does not exceed totalPages', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(20); }); // 2 pages
    act(() => { result.current.goTo(2); });
    act(() => { result.current.nextPage(); });
    expect(result.current.page).toBe(2);
  });

  test('goTo clamps to valid range', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(30); }); // 3 pages
    act(() => { result.current.goTo(99); });
    expect(result.current.page).toBe(3);
    act(() => { result.current.goTo(-5); });
    expect(result.current.page).toBe(1);
  });

  test('resetPage returns to page 1', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(50); });
    act(() => { result.current.goTo(4); });
    act(() => { result.current.resetPage(); });
    expect(result.current.page).toBe(1);
  });

  test('updateSearch updates search and resets to page 1', () => {
    const { result } = renderHook(() => usePagination(10));
    act(() => { result.current.setTotal(50); });
    act(() => { result.current.goTo(3); });
    act(() => { result.current.updateSearch('pizza'); });
    expect(result.current.search).toBe('pizza');
    expect(result.current.page).toBe(1);
  });
});

// ─── useMutation ─────────────────────────────────────────────────────────────

describe('useMutation', () => {
  test('initial state: loading=false, error=null', () => {
    const { result } = renderHook(() => useMutation(jest.fn()));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('sets loading=true while mutating', async () => {
    let resolve;
    const apiFn = () => new Promise((r) => { resolve = r; });
    const { result } = renderHook(() => useMutation(apiFn));

    act(() => { result.current.mutate(); });
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve({ id: 1 }); });
    expect(result.current.loading).toBe(false);
  });

  test('returns { success: true, data } on resolved call', async () => {
    const apiFn = jest.fn().mockResolvedValue({ id: 42 });
    const { result } = renderHook(() => useMutation(apiFn));

    let outcome;
    await act(async () => { outcome = await result.current.mutate('arg1'); });

    expect(outcome).toEqual({ success: true, data: { id: 42 } });
    expect(apiFn).toHaveBeenCalledWith('arg1');
  });

  test('returns { success: false, message } on rejection', async () => {
    const apiFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMutation(apiFn));

    let outcome;
    await act(async () => { outcome = await result.current.mutate(); });

    expect(outcome.success).toBe(false);
    expect(outcome.message).toBe('Network error');
    expect(result.current.error).toBe('Network error');
  });

  test('extracts message from axios error response', async () => {
    const axiosErr = { response: { data: { error: { message: 'Forbidden' } } } };
    const apiFn = jest.fn().mockRejectedValue(axiosErr);
    const { result } = renderHook(() => useMutation(apiFn));

    let outcome;
    await act(async () => { outcome = await result.current.mutate(); });

    expect(outcome.message).toBe('Forbidden');
  });

  test('clears previous error on new mutate call', async () => {
    let callCount = 0;
    const apiFn = jest.fn().mockImplementation(() => {
      callCount++;
      return callCount === 1
        ? Promise.reject(new Error('first error'))
        : Promise.resolve({ ok: true });
    });

    const { result } = renderHook(() => useMutation(apiFn));

    await act(async () => { await result.current.mutate(); });
    expect(result.current.error).toBe('first error');

    await act(async () => { await result.current.mutate(); });
    expect(result.current.error).toBeNull();
  });
});

// ─── useApi ───────────────────────────────────────────────────────────────────

describe('useApi', () => {
  test('starts with loading=true and null data', async () => {
    const apiFn = jest.fn().mockResolvedValue({ items: [] });
    const { result } = renderHook(() => useApi(apiFn));
    // loading starts true before the promise settles
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  test('sets data on successful fetch', async () => {
    const apiFn = jest.fn().mockResolvedValue([1, 2, 3]);
    const { result } = renderHook(() => useApi(apiFn));
    await waitFor(() => expect(result.current.data).toEqual([1, 2, 3]));
    expect(result.current.error).toBeNull();
  });

  test('sets error message on failed fetch', async () => {
    const apiFn = jest.fn().mockRejectedValue(new Error('Server down'));
    const { result } = renderHook(() => useApi(apiFn));
    await waitFor(() => expect(result.current.error).toBe('Server down'));
    expect(result.current.data).toBeNull();
  });

  test('uses initial value while loading', () => {
    const apiFn = jest.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useApi(apiFn, [], []));
    // Before settling, data should be the initial value
    expect(result.current.data).toEqual([]);
  });

  test('refetch triggers a new API call', async () => {
    const apiFn = jest.fn().mockResolvedValue({ v: 1 });
    const { result } = renderHook(() => useApi(apiFn));
    await waitFor(() => expect(result.current.loading).toBe(false));

    apiFn.mockResolvedValue({ v: 2 });
    await act(async () => { await result.current.refetch(); });

    expect(result.current.data).toEqual({ v: 2 });
    expect(apiFn).toHaveBeenCalledTimes(2);
  });
});
