import { CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { Composition } from './Composition';

const endpoints = [
  ['GET', '/api/health', 'Estado del backend'],
  ['POST', '/api/files', 'Subida multipart (campo "file")'],
  ['GET', '/api/files', 'Listado de archivos'],
  ['GET', '/api/files/{id}', 'Detalle y estado'],
  ['GET', '/api/files/{id}/result', 'Resultado del procesado'],
  ['POST', '/api/files/{id}/reprocess', 'Volver a procesar'],
  ['DELETE', '/api/files/{id}', 'Eliminar archivo'],
];

export function Connection({ online, mock, version }: { online: boolean | null; mock: boolean; version?: string }) {
  return (
    <div className="grid-2">
      <section className="card conn-card">
        <div className="card-head"><h3>Estado</h3></div>
        <div className="conn-status">
          {mock ? <FlaskConical size={34} /> : online ? <CheckCircle2 size={34} /> : <XCircle size={34} />}
          <div>
            <b>{mock ? 'Modo demo activo' : online ? 'Conectado al backend' : 'Sin conexión con el backend'}</b>
            <p className="muted">
              {mock
                ? 'Los datos son simulados en el navegador. Pon VITE_USE_MOCK=false en .env para usar tu API .NET.'
                : online
                  ? `Versión del API: ${version ?? 'desconocida'}`
                  : 'Comprueba que el API está levantado y que VITE_BACKEND_URL apunta a él.'}
            </p>
          </div>
        </div>
        <Composition preset="sidebar" className="conn-art" />
      </section>
      <section className="card">
        <div className="card-head"><h3>Endpoints esperados</h3></div>
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
