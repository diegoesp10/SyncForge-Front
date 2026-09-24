import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CHECK_INTERVAL_MS, type BackendStatus } from '../hooks/useBackendStatus';
import { useI18n, type Translate } from '../i18n';
import { AsyncButton } from './AsyncButton';

type Shown = BackendStatus['state'];
const tones: Record<Shown, string> = { checking: 'wait', online: 'ok', degraded: 'warn', offline: 'err' };
const seconds = CHECK_INTERVAL_MS / 1000;

function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

function ago(at: number | null, now: number, t: Translate, locale: string) {
  if (!at) return '—';
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 5) return t('backend.justNow');
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  return s < 60 ? rtf.format(-s, 'second') : rtf.format(-Math.round(s / 60), 'minute');
}

/** Píldora de la cabecera: estado de la API de un vistazo; al pulsarla comprueba al momento. */
export function BackendPill({ status }: { status: BackendStatus }) {
  const { t } = useI18n();
  const shown: Shown = status.checking && status.state === 'checking' ? 'checking' : status.state;
  const short = t(`backend.states.${shown}.short`);
  const withLatency = shown === 'online' && status.latency != null ? `${short} · ${status.latency} ms` : short;
  return (
    <div className="backend-pill-wrap">
      <button
        className={`conn conn-${tones[shown]} ${status.checking ? 'is-checking' : ''}`}
        onClick={() => void status.check()}
        title={t('backend.pillTitle', { status: withLatency })}
        aria-label={t('backend.pillAria', { status: short })}
      >
        <i className="conn-dot" />
        <span className="conn-label">{short}</span>
        {shown === 'online' && status.latency != null && <span className="conn-ms">{status.latency} ms</span>}
      </button>
    </div>
  );
}

/** Tarjeta de la vista Conexión: señal grande, datos de la última comprobación y pulso de latencia. */
export function BackendPanel({ status }: { status: BackendStatus }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const shown = status.state;
  // Altura relativa a la comprobación más lenta del historial (entre el 35 % y el 100 %)
  const max = Math.max(1, ...status.history.map((p) => p.ms));
  const slots = Array.from({ length: 20 }, (_, i) => status.history[status.history.length - 20 + i]);

  return (
    <section className="card backend-card">
      <div className="card-head">
        <h3>{t('backend.cardTitle')}</h3>
        <span className="count">GET /api/health</span>
      </div>

      <div className={`signal signal-${tones[shown]}`}>
        <div className="signal-orb" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="signal-copy">
          <span className="eyebrow">{t('backend.eyebrow')}</span>
          <p className="signal-title">{t(`backend.states.${shown}.title`)}<span className="h1-dot">.</span></p>
          <p className="signal-desc">{t(`backend.states.${shown}.desc`)}</p>
        </div>
      </div>

      <dl className="signal-meta">
        <div><dt>{t('backend.latency')}</dt><dd className="mono">{status.latency != null && shown !== 'offline' ? `${status.latency} ms` : '—'}</dd></div>
        <div><dt>{t('backend.version')}</dt><dd className="mono">{status.version ?? '—'}</dd></div>
        <div><dt>{t('backend.checked')}</dt><dd>{ago(status.checkedAt, now, t, locale)}</dd></div>
        <div><dt>{t('backend.interval')}</dt><dd>{t('backend.every', { seconds })}</dd></div>
      </dl>

      <div className="heartbeat" role="img" aria-label={t('backend.historyAria', { count: status.history.length })}>
        {slots.map((p, i) => (
          <span
            key={i}
            className={p ? `hb hb-${tones[p.state]}` : 'hb hb-empty'}
            style={p && p.state !== 'offline' ? { height: `${35 + (p.ms / max) * 65}%` } : undefined}
            title={p ? `${t(`backend.states.${p.state}.short`)} · ${p.ms} ms` : undefined}
          />
        ))}
      </div>
      <div className="heartbeat-legend">
        <span>{t('backend.history')}</span>
        <span>{t('backend.now')}</span>
      </div>

      <div className="backend-actions">
        <AsyncButton className="btn-primary" icon={<RefreshCw size={16} />} busyLabel={t('backend.checking')} onClick={status.check}>
          {t('backend.checkNow')}
        </AsyncButton>
      </div>
    </section>
  );
}

/** Aviso en la parte superior cuando la API no responde. */
export function OfflineBanner({ status }: { status: BackendStatus }) {
  const { t } = useI18n();
  if (status.state !== 'offline' && status.state !== 'degraded') return null;
  return (
    <div className={`banner banner-${tones[status.state]}`} role="alert">
      <i className="conn-dot" aria-hidden />
      <p>
        <b>{t(status.state === 'offline' ? 'backend.bannerOffline' : 'backend.bannerDegraded')}</b> {t('backend.bannerRetry', { seconds })}
      </p>
      <AsyncButton className="btn-ghost sm" icon={<RefreshCw size={14} />} busyLabel={t('backend.checking')} onClick={status.check}>
        {t('backend.retry')}
      </AsyncButton>
    </div>
  );
}
