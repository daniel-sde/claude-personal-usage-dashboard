import { useState, useEffect, useRef, useCallback } from 'react';

export function useSSE(url) {
  const [events, setEvents] = useState({});
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      retryRef.current = 0;
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      const delay = Math.min(30_000, 1_000 * 2 ** retryRef.current);
      retryRef.current += 1;
      retryTimerRef.current = setTimeout(connect, delay);
    };

    es.addEventListener('tick', (e) => {
      try {
        setEvents((prev) => ({ ...prev, tick: JSON.parse(e.data) }));
      } catch {}
    });

    es.addEventListener('session_start', (e) => {
      try {
        setEvents((prev) => ({ ...prev, session_start: JSON.parse(e.data) }));
      } catch {}
    });

    es.addEventListener('session_end', (e) => {
      try {
        setEvents((prev) => ({ ...prev, session_end: JSON.parse(e.data) }));
      } catch {}
    });
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryTimerRef.current);
      esRef.current?.close();
    };
  }, [connect]);

  return { events, connected };
}
