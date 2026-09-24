import { useCallback, useEffect, useRef, useState } from 'react';
import { pingBackend, type BackendState } from '../api/client';

export interface Ping {
  state: BackendState;
  ms: number;
  at: number;
}

export const CHECK_INTERVAL_MS = 15000;
const HISTORY = 20;
const MIN_CHECK_MS = 450;

/**
 * Comprueba /api/health contra la API real (también en modo demo) cada 15 s y bajo demanda.
 * Guarda las últimas comprobaciones para dibujar el pulso de latencia.
 */
export function useBackendStatus() {
  const [state, setState] = useState<BackendState | 'checking'>('checking');
  const [checking, setChecking] = useState(false);
  const [version, setVersion] = useState<string>();
  const [history, setHistory] = useState<Ping[]>([]);
  const inFlight = useRef<Promise<void> | null>(null);

  const check = useCallback(() => {
    // Si ya hay una comprobación en marcha, se reutiliza en lugar de lanzar otra
    if (inFlight.current) return inFlight.current;
    setChecking(true);
    const run = (async () => {
      const [r] = await Promise.all([pingBackend(), new Promise((res) => setTimeout(res, MIN_CHECK_MS))]);
      setState(r.state);
      if (r.version) setVersion(r.version);
      setHistory((h) => [...h, { state: r.state, ms: r.ms, at: Date.now() }].slice(-HISTORY));
      setChecking(false);
      inFlight.current = null;
    })();
    inFlight.current = run;
    return run;
  }, []);

  useEffect(() => {
    void check();
    const timer = window.setInterval(() => {
      if (!document.hidden) void check();
    }, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [check]);

  const last = history.at(-1);
  return { state, checking, version, history, latency: last?.ms ?? null, checkedAt: last?.at ?? null, check };
}

export type BackendStatus = ReturnType<typeof useBackendStatus>;
