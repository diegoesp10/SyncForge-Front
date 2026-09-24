import { Check, X, ShieldAlert, ServerCrash } from 'lucide-react';
import type { UploadTask } from '../hooks/useUploads';
import type { RejectCode } from '../utils/validateFile';
import { FileIcon } from './FileIcon';
import { formatBytes, SUPPORTED_EXTENSIONS } from '../utils/format';

interface Props {
  tasks: UploadTask[];
  maxMb: number;
  onCancel: (key: string) => void;
  onClear: () => void;
}

const reasonLabels: Record<RejectCode, string> = {
  format: 'Formato',
  empty: 'Vacío',
  size: 'Tamaño',
  name: 'Nombre',
  binary: 'Contenido',
};

/** Etiqueta de origen del fallo: validación del frontal, respuesta de la API (con su código) o sin conexión. */
function origin(t: UploadTask) {
  if (t.state === 'rejected') return `Frontal · ${t.reason ? reasonLabels[t.reason] : 'Validación'}`;
  return t.status ? `API · ${t.status}` : 'Sin conexión';
}

export function UploadQueue({ tasks, maxMb, onCancel, onClear }: Props) {
  if (!tasks.length) return null;
  const hasFinished = tasks.some((t) => t.state !== 'uploading');
  const failed = tasks.filter((t) => t.state === 'rejected' || t.state === 'error').length;
  const showHint = tasks.some((t) => t.state === 'rejected' && (t.reason === 'format' || t.reason === 'binary' || t.reason === 'size'));

  return (
    <div className="card upload-queue">
      <div className="card-head">
        <h3>Subidas</h3>
        <span className="count">{tasks.length}</span>
        {failed > 0 && <span className="fail-chip">{failed} {failed === 1 ? 'rechazado' : 'rechazados'}</span>}
        <div className="spacer" />
        {hasFinished && (
          <button className="btn-ghost sm" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>
      <ul>
        {tasks.map((t) =>
          t.state === 'rejected' || t.state === 'error' ? (
            <li key={t.key} className={`uq-item uq-fail uq-${t.state}`}>
              <span className="file-icon fi-reject" aria-hidden>
                {t.state === 'rejected' ? <ShieldAlert size={18} strokeWidth={1.8} /> : <ServerCrash size={18} strokeWidth={1.8} />}
              </span>
              <div className="uq-body">
                <div className="uq-top">
                  <span className="uq-name" title={t.file.name}>{t.file.name}</span>
                  <span className="uq-origin">{origin(t)}</span>
                </div>
                <p className="uq-reason" role="alert">{t.error}</p>
              </div>
              <button className="icon-btn" onClick={() => onCancel(t.key)} aria-label={`Quitar ${t.file.name}`} title="Quitar">
                <X size={16} />
              </button>
            </li>
          ) : (
            <li key={t.key} className={`uq-item uq-${t.state}`}>
              <FileIcon name={t.file.name} />
              <div className="uq-body">
                <div className="uq-top">
                  <span className="uq-name" title={t.file.name}>{t.file.name}</span>
                  <span className="uq-meta">{t.state === 'done' ? 'Subido' : `${t.progress}% · ${formatBytes(t.file.size)}`}</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${t.progress}%` }} />
                </div>
              </div>
              {t.state === 'done' ? (
                <span className="uq-state ok"><Check size={16} /></span>
              ) : (
                <button className="icon-btn" onClick={() => onCancel(t.key)} aria-label={`Cancelar ${t.file.name}`} title="Cancelar">
                  <X size={16} />
                </button>
              )}
            </li>
          ),
        )}
      </ul>
      {showHint && (
        <p className="uq-hint">
          Se admiten <b>{SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(' ')}</b> de texto, hasta {maxMb} MB.
        </p>
      )}
    </div>
  );
}
