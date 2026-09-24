import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CHECK_INTERVAL_MS, type BackendStatus } from '../hooks/useBackendStatus';
import { AsyncButton } from './AsyncButton';

const copy = {
  checking: { tone: 'wait', short: 'Comprobando…', title: 'Comprobando', desc: 'Llamando a /api/health…' },
  online: { tone: 'ok', short: 'API en línea', title: 'En línea', desc: 'La API responde con normalidad.' },
  degraded: { tone: 'warn', short: 'API con fallos', title: 'Con fallos', desc: 'La API responde, pero su comprobación de salud indica un problema (503).' },
  offline: { tone: 'err', short: 'API caída', title: 'Caída', desc: 'La API no responde. Comprueba que está levantada y que VITE_BACKEND_URL apunta a ella.' },
} as const;

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

function ago(at: number | null, now: number) {
  if (!at) return '—';
  const s = Math.max(0, Math.round((now - at) / 1000));
  return s < 5 ? 'ahora mismo' : s < 60 ? `hace ${s} s` : `hace ${Math.round(s / 60)} min`;
}

/** Píldora de la cabecera: estado de la API de un vistazo; al pulsarla comprueba al momento. */
export function BackendPill({ status }: { status: BackendStatus }) {
  const shown = status.checking && status.state === 'checking' ? 'checking' : status.state;
  const c = copy[shown];
  return (
    <div className="backend-pill-wrap">
      <button
        className={`conn conn-${c.tone} ${status.checking ? 'is-checking' : ''}`}
        onClick={() => void status.check()}
        title={`${c.short}${status.latency != null && shown === 'online' ? ` · ${status.latency} ms` : ''} · pulsa para comprobar ahora`}
        aria-label={`${c.short}. Pulsa para comprobar el estado de la API`}
      >
        <i className="conn-dot" />
        <span className="conn-label">{c.short}</span>
        {shown === 'online' && status.latency != null && <span className="conn-ms">{status.latency} ms</span>}
      </button>
    </div>
  );
}

/** Tarjeta de la vista Conexión: señal grande, datos de la última comprobación y pulso de latencia. */
export function BackendPanel({ status }: { status: BackendStatus }) {
  const now = useNow();
  const shown = status.state;
  const c = copy[shown];
  // Altura relativa a la comprobación más lenta del historial (entre el 35 % y el 100 %)
  const max = Math.max(1, ...status.history.map((p) => p.ms));
  const slots = Array.from({ length: 20 }, (_, i) => status.history[status.history.length - 20 + i]);

  return (
    <section className="card backend-card">
      <div className="card-head">
        <h3>Backend</h3>
        <span className="count">GET /api/health</span>
      </div>

      <div className={`signal signal-${c.tone}`}>
        <div className="signal-orb" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="signal-copy">
          <span className="eyebrow">Estado de la API</span>
          <p className="signal-title">{c.title}<span className="h1-dot">.</span></p>
          <p className="signal-desc">{c.desc}</p>
        </div>
      </div>

      <dl className="signal-meta">
        <div><dt>Latencia</dt><dd className="mono">{status.latency != null && shown !== 'offline' ? `${status.latency} ms` : '—'}</dd></div>
        <div><dt>Versión</dt><dd className="mono">{status.version ?? '—'}</dd></div>
        <div><dt>Comprobado</dt><dd>{ago(status.checkedAt, now)}</dd></div>
        <div><dt>Intervalo</dt><dd>cada {CHECK_INTERVAL_MS / 1000} s</dd></div>
      </dl>

      <div className="heartbeat" role="img" aria-label={`Últimas ${status.history.length} comprobaciones`}>
        {slots.map((p, i) => (
          <span
            key={i}
            className={p ? `hb hb-${copy[p.state].tone}` : 'hb hb-empty'}
            style={p && p.state !== 'offline' ? { height: `${35 + (p.ms / max) * 65}%` } : undefined}
            title={p ? `${copy[p.state].short} · ${p.ms} ms` : undefined}
          />
        ))}
      </div>
      <div className="heartbeat-legend">
        <span>Últimas comprobaciones</span>
        <span>ahora</span>
      </div>

      <div className="backend-actions">
        <AsyncButton className="btn-primary" icon={<RefreshCw size={16} />} busyLabel="Comprobando…" onClick={status.check}>
          Comprobar ahora
        </AsyncButton>
      </div>

    </section>
  );
}

/** Aviso en la parte superior cuando la API no responde. */
export function OfflineBanner({ status }: { status: BackendStatus }) {
  if (status.state !== 'offline' && status.state !== 'degraded') return null;
  return (
    <div className={`banner banner-${copy[status.state].tone}`} role="alert">
      <i className="conn-dot" aria-hidden />
      <p>
        <b>{status.state === 'offline' ? 'La API no responde.' : 'La API tiene problemas.'}</b>{' '}
        Se vuelve a comprobar cada {CHECK_INTERVAL_MS / 1000} s.
      </p>
      <AsyncButton className="btn-ghost sm" icon={<RefreshCw size={14} />} busyLabel="Comprobando…" onClick={status.check}>
        Reintentar
      </AsyncButton>
    </div>
  );
}
