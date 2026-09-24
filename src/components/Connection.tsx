import type { BackendStatus } from '../hooks/useBackendStatus';
import { BackendPanel } from './BackendStatus';

const endpoints = [
  ['GET', '/api/health', 'Estado del backend'],
  ['POST', '/api/files', 'Subida multipart (campo "file")'],
  ['GET', '/api/files', 'Listado de archivos'],
  ['GET', '/api/files/{id}', 'Detalle y estado'],
  ['GET', '/api/files/{id}/result', 'Resultado del procesado'],
  ['POST', '/api/files/{id}/reprocess', 'Volver a procesar'],
  ['DELETE', '/api/files/{id}', 'Eliminar archivo'],
];

export function Connection({ backend }: { backend: BackendStatus }) {
  return (
    <div className="grid-2">
      <BackendPanel status={backend} />
      <section className="card">
        <div className="card-head"><h3>Endpoints</h3><span className="count">{endpoints.length}</span></div>
        <ul className="endpoints">
          {endpoints.map(([m, p, d]) => (
            <li key={m + p}>
              <span className={`method m-${m.toLowerCase()}`}>{m}</span>
              <code>{p}</code>
              <span className="muted">{d}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
