import { useMemo, useState } from 'react';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import type { FileItem, FileStatus } from '../api/types';
import { FileIcon } from './FileIcon';
import { Composition } from './Composition';
import { StatusBadge, statusLabels } from './StatusBadge';
import { formatBytes, timeAgo, extOf } from '../utils/format';

interface Props {
  files: FileItem[];
  loading: boolean;
  title?: string;
  limit?: number;
  onOpen: (f: FileItem) => void;
  onRefresh: () => void;
  onSeeAll?: () => void;
}

const filters: (FileStatus | 'All')[] = ['All', 'Processing', 'Completed', 'Failed'];

export function FileList({ files, loading, title = 'Archivos', limit, onOpen, onRefresh, onSeeAll }: Props) {
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
          <button className="icon-btn" onClick={onRefresh} aria-label="Actualizar">
            <RefreshCw size={15} />
          </button>
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
        <div className="skeleton-list">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">
          <Composition preset="empty" />
          <p>{files.length ? 'Nada coincide con el filtro' : 'Aún no hay archivos'}</p>
          <small>{files.length ? 'Prueba con otra búsqueda o estado.' : 'Los que subas aparecerán aquí.'}</small>
        </div>
      ) : (
        <>
          {/* Tabla en escritorio */}
          <table className="table">
            <thead>
              <tr>
                <th className="col-name">Nombre</th>
                <th>Tipo</th>
                <th className="num">Tamaño</th>
                <th>Subido</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((f) => (
                <tr key={f.id} onClick={() => onOpen(f)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen(f)}>
                  <td className="col-name">
                    <div className="name-cell">
                      <FileIcon name={f.fileName} />
                      <span title={f.fileName}>{f.fileName}</span>
                    </div>
                  </td>
                  <td><span className="ext">{extOf(f.fileName) || '—'}</span></td>
                  <td className="num mono">{formatBytes(f.size)}</td>
                  <td className="muted">{timeAgo(f.uploadedAt)}</td>
                  <td><StatusBadge status={f.status} progress={f.progress} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tarjetas en móvil */}
          <ul className="file-cards">
            {shown.map((f) => (
              <li key={f.id} onClick={() => onOpen(f)}>
                <FileIcon name={f.fileName} size={20} />
                <div className="fc-body">
                  <span className="fc-name">{f.fileName}</span>
                  <span className="fc-meta">{formatBytes(f.size)} · {timeAgo(f.uploadedAt)}</span>
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
