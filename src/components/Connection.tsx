import type { BackendStatus } from '../hooks/useBackendStatus';
import { useI18n, type MessageKey } from '../i18n';
import { BackendPanel } from './BackendStatus';

// Endpoints que usa el frontal (ver API_CONTRACT.md)
const endpoints: [string, string, MessageKey][] = [
  ['GET', '/api/health', 'connection.health'],
  ['POST', '/api/files', 'connection.upload'],
  ['GET', '/api/files', 'connection.list'],
  ['GET', '/api/files/{id}/result', 'connection.result'],
  ['POST', '/api/files/{id}/reprocess', 'connection.reprocess'],
  ['POST', '/api/trash-can/{id}', 'connection.moveToTrash'],
  ['GET', '/api/trash-can', 'connection.trashList'],
  ['GET', '/api/trash-can/{id}/result', 'connection.trashResult'],
  ['POST', '/api/trash-can/{id}/restore', 'connection.restore'],
  ['DELETE', '/api/trash-can/{id}', 'connection.purge'],
];

export function Connection({ backend }: { backend: BackendStatus }) {
  const { t } = useI18n();
  return (
    <div className="grid-2">
      <BackendPanel status={backend} />
      <section className="card">
        <div className="card-head"><h3>{t('connection.endpoints')}</h3><span className="count">{endpoints.length}</span></div>
        <ul className="endpoints">
          {endpoints.map(([m, p, d]) => (
            <li key={m + p}>
              <span className={`method m-${m.toLowerCase()}`}>{m}</span>
              <code>{p}</code>
              <span className="muted">{t(d)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
