import { Check, X, ShieldAlert, ServerCrash } from 'lucide-react';
import type { UploadTask } from '../hooks/useUploads';
import { useI18n, type Translate } from '../i18n';
import { rejectionMessage } from '../utils/validateFile';
import { FileIcon } from './FileIcon';
import { formatBytes, SUPPORTED_EXTENSIONS } from '../utils/format';

interface Props {
  tasks: UploadTask[];
  maxMb: number;
  onCancel: (key: string) => void;
  onClear: () => void;
}

/** Etiqueta de origen del fallo: validación del frontal, respuesta de la API (con su código) o sin conexión. */
function origin(task: UploadTask, t: Translate) {
  if (task.state === 'rejected') return t('uploads.originClient', { reason: t(`uploads.reasons.${task.rejection?.code ?? 'format'}`) });
  return task.status ? t('uploads.originApi', { status: task.status }) : t('uploads.originOffline');
}

export function UploadQueue({ tasks, maxMb, onCancel, onClear }: Props) {
  const { t } = useI18n();
  if (!tasks.length) return null;
  const hasFinished = tasks.some((task) => task.state !== 'uploading');
  const failed = tasks.filter((task) => task.state === 'rejected' || task.state === 'error').length;
  const showHint = tasks.some((task) => task.state === 'rejected' && ['format', 'binary', 'size'].includes(task.rejection?.code ?? ''));

  return (
    <div className="card upload-queue">
      <div className="card-head">
        <h3>{t('uploads.title')}</h3>
        <span className="count">{tasks.length}</span>
        {failed > 0 && <span className="fail-chip">{t('uploads.rejectedChip', { count: failed })}</span>}
        <div className="spacer" />
        {hasFinished && (
          <button className="btn-ghost sm" onClick={onClear}>
            {t('uploads.clear')}
          </button>
        )}
      </div>
      <ul>
        {tasks.map((task) =>
          task.state === 'rejected' || task.state === 'error' ? (
            <li key={task.key} className={`uq-item uq-fail uq-${task.state}`}>
              <span className="file-icon fi-reject" aria-hidden>
                {task.state === 'rejected' ? <ShieldAlert size={18} strokeWidth={1.8} /> : <ServerCrash size={18} strokeWidth={1.8} />}
              </span>
              <div className="uq-body">
                <div className="uq-top">
                  <span className="uq-name" title={task.file.name}>{task.file.name}</span>
                  <span className="uq-origin">{origin(task, t)}</span>
                </div>
                <p className="uq-reason" role="alert">
                  {task.rejection ? rejectionMessage(task.rejection, t) : task.error}
                </p>
              </div>
              <button
                className="icon-btn"
                onClick={() => onCancel(task.key)}
                aria-label={t('uploads.removeAria', { name: task.file.name })}
                title={t('uploads.remove')}
              >
                <X size={16} />
              </button>
            </li>
          ) : (
            <li key={task.key} className={`uq-item uq-${task.state}`}>
              <FileIcon name={task.file.name} />
              <div className="uq-body">
                <div className="uq-top">
                  <span className="uq-name" title={task.file.name}>{task.file.name}</span>
                  <span className="uq-meta">{task.state === 'done' ? t('uploads.uploaded') : `${task.progress}% · ${formatBytes(task.file.size)}`}</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${task.progress}%` }} />
                </div>
              </div>
              {task.state === 'done' ? (
                <span className="uq-state ok"><Check size={16} /></span>
              ) : (
                <button
                  className="icon-btn"
                  onClick={() => onCancel(task.key)}
                  aria-label={t('uploads.cancelAria', { name: task.file.name })}
                  title={t('uploads.cancel')}
                >
                  <X size={16} />
                </button>
              )}
            </li>
          ),
        )}
      </ul>
      {showHint && (
        <p className="uq-hint">
          {t('uploads.hint', { formats: SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(' '), max: maxMb })}
        </p>
      )}
    </div>
  );
}
