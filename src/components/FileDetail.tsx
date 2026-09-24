import { useEffect, useState } from 'react';
import { X, RotateCw, Trash2, Download, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import type { FileItem, FileResult } from '../api/types';
import { useI18n } from '../i18n';
import { FileIcon } from './FileIcon';
import { AsyncButton } from './AsyncButton';
import { Loader, LoadingState } from './Loader';
import { StatusBadge } from './StatusBadge';
import { FilePreview } from './FilePreview';
import { extOf, formatBytes, formatDate, SUPPORTED_EXTENSIONS } from '../utils/format';

interface Props {
  file: FileItem | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onReprocess: (id: string) => Promise<void>;
}

export function FileDetail({ file: current, onClose, onDelete, onReprocess }: Props) {
  const { t, has, lang, locale } = useI18n();
  // Conserva el último archivo mientras el panel se cierra para que la animación no quede vacía
  const [last, setLast] = useState<FileItem | null>(current);
  useEffect(() => {
    if (current) setLast(current);
  }, [current]);
  const file = current ?? last;
  const isOpen = !!current;
  const [result, setResult] = useState<FileResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const status = file?.status;

  // También se vuelve a pedir al cambiar de idioma: los avisos del resultado los traduce la API
  useEffect(() => {
    setResult(null);
    setErr(null);
    if (!file || status !== 'Completed') return;
    let alive = true;
    setLoading(true);
    api
      .getResult(file.id)
      .then((r) => alive && setResult(r))
      .catch((e: Error) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [file?.id, status, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (!isOpen) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, isOpen]);

  // Descarga el resultado recién pedido a la API (no el que se cargó al abrir el panel)
  const download = async () => {
    if (!file) return;
    try {
      const fresh = await api.getResult(file.id);
      const blob = new Blob([JSON.stringify(fresh, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${file.fileName}.result.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('detail.downloadFailed'));
    }
  };

  const formats = SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(', ');
  const supported = file ? SUPPORTED_EXTENSIONS.includes(extOf(file.fileName)) : false;

  return (
    <>
      <div className={`scrim ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} inert={!isOpen}>
        {file && (
          <>
            <header className="drawer-head">
              <FileIcon name={file.fileName} size={22} />
              <div className="drawer-title">
                <span className="eyebrow mono">{file.contentType}</span>
                <h2 title={file.fileName}>{file.fileName}</h2>
              </div>
              <button className="icon-btn" onClick={onClose} aria-label={t('detail.close')}>
                <X size={18} />
              </button>
            </header>

            <div className="drawer-body">
              <div className="meta-grid">
                <div><span>{t('detail.status')}</span><StatusBadge status={file.status} progress={file.progress} /></div>
                <div><span>{t('detail.size')}</span><b className="mono">{formatBytes(file.size)}</b></div>
                <div><span>{t('detail.uploaded')}</span><b>{formatDate(file.uploadedAt, locale)}</b></div>
                <div><span>{t('detail.processed')}</span><b>{formatDate(file.processedAt, locale)}</b></div>
              </div>

              {file.status === 'Processing' && (
                <div className="progress lg">
                  <div className="progress-bar" style={{ width: `${file.progress ?? 30}%` }} />
                </div>
              )}

              {file.status === 'Failed' && (
                <div className="failure" role="alert">
                  <span className="failure-mark" aria-hidden />
                  <div>
                    <span className="eyebrow">{t('detail.failureEyebrow')}</span>
                    <p className="failure-title">{t('detail.failureTitle')}<span className="h1-dot">.</span></p>
                    <p className="failure-reason">{file.error ?? t('detail.failureFallback')}</p>
                    <p className="failure-hint">
                      {supported ? t('detail.failureHintContent') : t('detail.failureHintFormat', { formats })}
                    </p>
                  </div>
                </div>
              )}

              {(file.status === 'Pending' || file.status === 'Processing') && (
                <div className="waiting">
                  <Loader label={t('detail.processingAria')} />
                  <p>{t('detail.processing')}</p>
                </div>
              )}

              {loading && <LoadingState label={t('detail.loadingResult')} />}
              {err && <div className="alert err"><AlertTriangle size={16} /><span>{err}</span></div>}

              {result && (
                <>
                  <div className="summary">
                    {Object.entries(result.summary).map(([k, v]) => {
                      if (v === undefined || v === null) return null;
                      const labelKey = `detail.summary.${k}`;
                      return (
                        <div key={k} className="summary-item">
                          <span>{has(labelKey) ? t(labelKey) : k}</span>
                          <b className="mono">
                            {k === 'durationMs' ? `${Number(v).toLocaleString(locale)} ms` : typeof v === 'number' ? v.toLocaleString(locale) : v}
                          </b>
                        </div>
                      );
                    })}
                  </div>
                  {result.warnings?.map((w, i) => (
                    <div key={i} className="alert warn"><AlertTriangle size={16} /><span>{w}</span></div>
                  ))}
                  <h4 className="section-title">{t('detail.preview')}</h4>
                  <FilePreview preview={result.preview} />
                </>
              )}
            </div>

            <footer className="drawer-foot">
              <AsyncButton
                className="btn-ghost danger"
                icon={<Trash2 size={16} />}
                busyLabel={t('detail.deleting')}
                aria-label={t('detail.deleteAria')}
                onClick={() => onDelete(file.id).then(onClose)}
              >
                {t('detail.delete')}
              </AsyncButton>
              <div className="spacer" />
              {(file.status === 'Failed' || file.status === 'Completed') && supported && (
                <AsyncButton className="btn-ghost" icon={<RotateCw size={16} />} busyLabel={t('detail.reprocessing')} onClick={() => onReprocess(file.id)}>
                  {t('detail.reprocess')}
                </AsyncButton>
              )}
              <AsyncButton className="btn-primary" icon={<Download size={16} />} busyLabel={t('detail.downloading')} disabled={!result} onClick={download}>
                {t('detail.result')}
              </AsyncButton>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
