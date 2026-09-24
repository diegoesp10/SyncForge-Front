import { useMemo, useState } from 'react';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import type { FileItem, FileStatus } from '../api/types';
import { FileIcon } from './FileIcon';
import { Composition } from './Composition';
import { AsyncButton } from './AsyncButton';
import { LoadingState } from './Loader';
import { StatusBadge, statusLabels } from './StatusBadge';
import { formatBytes, timeAgo, extOf } from '../utils/format';

interface Props {
  files: FileItem[];
  loading: boolean;
  /** Error de la última carga: si no hay nada que mostrar, se enseña en lugar del estado vacío */
  error?: string | null;
  title?: string;
  limit?: number;
  onOpen: (f: FileItem) => void;
  onRefresh: () => Promise<void>;
  onSeeAll?: () => void;
}

const filters: (FileStatus | 'All')[] = ['All', 'Processing', 'Completed', 'Failed'];

export function FileList({ files, loading, error, title = 'Archivos', limit, onOpen, onRefresh, onSeeAll }: Props) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<FileStatus | 'All'>('All');

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = files.filter(
      (f) =>
        (!term || f.fileName.toLowerCase().includes(term)) &&
        (status === 'All' || f.status === status || (status === 'Processing' && f.status === 'Pending')),
    );
    if (limit) list = list.slice(0, limit);
    return list;
  }, [files, q, status, limit]);

  return (
    <section className="card file-list">
      <div className="card-head wrap">
        <h3>{title}</h3>
        <span className="count">{files.length}</span>
        <div className="fl-tools">
          {!limit && (
            <label className="search">
              <Search size={15} />
              <input placeholder="Buscar archivo…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          )}
          <AsyncButton className="icon-btn" onClick={onRefresh} icon={<RefreshCw size={15} />} aria-label="Actualizar" title="Actualizar" />
          {onSeeAll && (
            <button className="btn-ghost sm" onClick={onSeeAll}>
              Ver todos <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {!limit && (
        <div className="chips">
          {filters.map((f) => (
            <button key={f} className={`chip ${status === f ? 'active' : ''}`} onClick={() => setStatus(f)}>
              {f === 'All' ? 'Todos' : statusLabels[f]}
              <span className="chip-count">
                {f === 'All' ? files.length : files.filter((x) => x.status === f || (f === 'Processing' && x.status === 'Pending')).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingState label="Cargando archivos…" />
      ) : error && files.length === 0 ? (
        <div className="empty is-error">
          <Composition preset="empty" />
          <p>No se pudo cargar la lista</p>
          <small>{error}</small>
          <AsyncButton className="btn-ghost sm" icon={<RefreshCw size={14} />} busyLabel="Cargando…" onClick={onRefresh}>
            Reintentar
          </AsyncButton>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">
          <Composition preset="empty" />
          <p>{files.length ? 'Nada coincide con el filtro' : 'Aún no hay archivos'}</p>
          <small>{files.length ? 'Prueba con otra búsqueda o estado.' : 'Los que subas aparecerán aquí.'}</small>
        </div>
      ) : (
        <>
          {/* Tabla si la tarjeta es ancha; tarjetas si es estrecha (container queries en index.css) */}
          <table className="table">
            <thead>
              <tr>
                <th className="col-name">Nombre</th>
                <th className="col-type">Tipo</th>
                <th className="num">Tamaño</th>
                <th className="col-date">Subido</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f.id} onClick={() => onOpen(f)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(f)}>
                  <td className="col-name">
                    <div className="name-cell">
                      <FileIcon name={f.fileName} />
                      <div className="name-text">
                        <span title={f.fileName}>{f.fileName}</span>
                        {f.status === 'Failed' && f.error && <span className="row-error" title={f.error}>{f.error}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="col-type"><span className="ext">{extOf(f.fileName) || '—'}</span></td>
                  <td className="num mono">{formatBytes(f.size)}</td>
                  <td className="col-date muted">{timeAgo(f.uploadedAt)}</td>
                  <td><StatusBadge status={f.status} progress={f.progress} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="file-cards">
            {shown.map((f) => (
              <li key={f.id} onClick={() => onOpen(f)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(f)}>
                <FileIcon name={f.fileName} size={20} />
                <div className="fc-body">
                  <span className="fc-name" title={f.fileName}>{f.fileName}</span>
                  {f.status === 'Failed' && f.error ? (
                    <span className="fc-meta row-error">{f.error}</span>
                  ) : (
                    <span className="fc-meta">
                      <span className="mono">{formatBytes(f.size)}</span> · {timeAgo(f.uploadedAt)}
                    </span>
                  )}
                </div>
                <StatusBadge status={f.status} progress={f.progress} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
