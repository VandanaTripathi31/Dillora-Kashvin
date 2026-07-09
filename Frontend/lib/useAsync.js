'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// Runs an async loader on mount (and whenever `deps` change) and exposes
// { data, error, loading, retry } so screens can show a spinner → error+retry
// instead of an infinite spinner when a request fails or times out.
//
// Race-safe: only the most recent run may commit state, so a slow earlier
// request resolving after a retry (or after unmount) is ignored.
//
//   const { data, error, loading, retry } = useAsync(() => api.getBestsellers(8), []);
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const runId = useRef(0);

  const run = useCallback(() => {
    const id = ++runId.current;
    // Keep any previously loaded data visible while re-fetching; clear the error.
    setState((s) => ({ data: s.data, error: null, loading: true }));
    Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => {
        if (id === runId.current) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (id === runId.current) setState({ data: null, error, loading: false });
      });
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
    // Invalidate the in-flight run on unmount / deps change so it can't setState.
    return () => { runId.current++; };
  }, [run]);

  return { ...state, retry: run };
}
