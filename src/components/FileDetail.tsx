import { useEffect, useState } from 'react';
import { X, RotateCw, Trash2, Download, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import type { FileItem, FileResult } from '../api/types';
import { FileIcon } from './FileIcon';
import { AsyncButton } from './AsyncButton';
import { Loader, LoadingState } from './Loader';
import { StatusBadge } from './StatusBadge';
import { FilePreview } from './FilePreview';
import { formatBytes, formatDate } from '../utils/format';

interface Props {
  file: FileItem | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onReprocess: (id: string) => Promise<void>;
}

const summaryLabels: Record<string, string> = {
  rows: 'Filas',
  columns: 'Columnas',
  lines: 'Líneas',
  encoding: 'Codificación',
  durationMs: 'Tiempo',
};

export function FileDetail({ file: current, onClose, onDelete, onReprocess }: Props) {
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
  }, [file?.id, status]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setErr(e instanceof Error ? e.message : 'No se pudo descargar el resultado');
    }
  };

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
              <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            <div className="drawer-body">
              <div className="meta-grid">
                <div><span>Estado</span><StatusBadge status={file.status} progress={file.progress} /></div>
                <div><span>Tamaño</span><b className="mono">{formatBytes(file.size)}</b></div>
                <div><span>Subido</span><b>{formatDate(file.uploadedAt)}</b></div>
                <div><span>Procesado</span><b>{formatDate(file.processedAt)}</b></div>
              </div>

              {file.status === 'Processing' && (
                <div className="progress lg">
                  <div className="progress-bar" style={{ width: `${file.progress ?? 30}%` }} />
                </div>
              )}

              {file.status === 'Failed' && (
                <div className="alert err">
                  <AlertTriangle size={16} />
                  <span>{file.error ?? 'El backend no pudo procesar el archivo.'}</span>
                </div>
              )}

              {(file.status === 'Pending' || file.status === 'Processing') && (
                <div className="waiting">
                  <Loader label="Procesando" />
                  <p>El backend está leyendo el archivo. El resultado aparecerá aquí automáticamente.</p>
                </div>
              )}

              {loading && <LoadingState label="Leyendo el resultado…" />}
              {err && <div className="alert err"><AlertTriangle size={16} /><span>{err}</span></div>}

              {result && (
                <>
                  <div className="summary">
                    {Object.entries(result.summary).map(([k, v]) =>
                      v === undefined ? null : (
                        <div key={k} className="summary-item">
                          <span>{summaryLabels[k] ?? k}</span>
                          <b className="mono">
                            {k === 'durationMs' ? `${Number(v).toLocaleString('es-ES')} ms` : typeof v === 'number' ? v.toLocaleString('es-ES') : v}
                          </b>
                        </div>
                      ),
                    )}
                  </div>
                  {result.warnings?.map((w, i) => (
                    <div key={i} className="alert warn"><AlertTriangle size={16} /><span>{w}</span></div>
                  ))}
                  <h4 className="section-title">Vista previa</h4>
                  <FilePreview preview={result.preview} />
                </>
              )}
            </div>

            <footer className="drawer-foot">
              <AsyncButton className="btn-ghost danger" icon={<Trash2 size={16} />} busyLabel="Eliminando…" aria-label="Eliminar archivo" onClick={() => onDelete(file.id).then(onClose)}>
                Eliminar
              </AsyncButton>
              <div className="spacer" />
              {(file.status === 'Failed' || file.status === 'Completed') && (
                <AsyncButton className="btn-ghost" icon={<RotateCw size={16} />} busyLabel="Enviando…" onClick={() => onReprocess(file.id)}>
                  Reprocesar
                </AsyncButton>
              )}
              <AsyncButton className="btn-primary" icon={<Download size={16} />} busyLabel="Descargando…" disabled={!result} onClick={download}>
                Resultado
              </AsyncButton>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
