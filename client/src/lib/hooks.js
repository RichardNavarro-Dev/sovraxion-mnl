import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

export function useApi(path, { enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled && path));
  const ctrlRef = useRef(null);

  const load = useCallback(async () => {
    if (!enabled || !path) return;
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path, { signal: ctrl.signal });
      setData(res);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err);
    } finally {
      if (ctrlRef.current === ctrl) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled, ...deps]);

  useEffect(() => {
    load();
    return () => ctrlRef.current?.abort();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
