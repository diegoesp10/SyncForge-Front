import { Check, X, AlertTriangle } from 'lucide-react';
import type { UploadTask } from '../hooks/useUploads';
import { FileIcon } from './FileIcon';
import { formatBytes } from '../utils/format';

interface Props {
  tasks: UploadTask[];
  onCancel: (key: string) => void;
  onClear: () => void;
}

export function UploadQueue({ tasks, onCancel, onClear }: Props) {
  if (!tasks.length) return null;
  const hasFinished = tasks.some((t) => t.state !== 'uploading');
  return (
    <div className="card upload-queue">
      <div className="card-head">
        <h3>Subidas</h3>
        <span className="count">{tasks.length}</span>
        <div className="spacer" />
        {hasFinished && (
          <button className="btn-ghost sm" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>
      <ul>
        {tasks.map((t) => (
          <li key={t.key} className={`uq-item uq-${t.state}`}>
            <FileIcon name={t.file.name} />
            <div className="uq-body">
              <div className="uq-top">
                <span className="uq-name" title={t.file.name}>{t.file.name}</span>
                <span className="uq-meta">
                  {t.state === 'error' ? t.error : t.state === 'done' ? 'Subido' : `${t.progress}% · ${formatBytes(t.file.size)}`}
                </span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${t.state === 'error' ? 100 : t.progress}%` }} />
              </div>
            </div>
            {t.state === 'done' ? (
              <span className="uq-state ok"><Check size={16} /></span>
            ) : t.state === 'error' ? (
              <button className="icon-btn danger" onClick={() => onCancel(t.key)} aria-label="Quitar">
                <AlertTriangle size={16} />
              </button>
            ) : (
              <button className="icon-btn" onClick={() => onCancel(t.key)} aria-label="Cancelar">
                <X size={16} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
