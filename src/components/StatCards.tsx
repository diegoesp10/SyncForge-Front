import type { FileItem } from '../api/types';
import { formatBytes } from '../utils/format';

export function StatCards({ files }: { files: FileItem[] }) {
  const busy = files.filter((f) => f.status === 'Pending' || f.status === 'Processing').length;
  const done = files.filter((f) => f.status === 'Completed').length;
  const failed = files.filter((f) => f.status === 'Failed').length;
  const total = files.reduce((s, f) => s + f.size, 0);
  const items = [
    { label: 'Archivos', value: files.length, sub: formatBytes(total), mark: 'circle', tone: 'accent' },
    { label: 'En proceso', value: busy, sub: busy ? 'trabajando…' : 'sin cola', mark: 'square', tone: 'ochre' },
    { label: 'Completados', value: done, sub: files.length ? `${Math.round((done / files.length) * 100)}% del total` : '—', mark: 'half', tone: 'ok' },
    { label: 'Con error', value: failed, sub: failed ? 'revisar' : 'todo en orden', mark: 'tri', tone: 'err' },
  ];
  return (
    <div className="stats">
      {items.map(({ label, value, sub, mark, tone }) => (
        <div key={label} className={`stat tone-${tone}`}>
          <div className="stat-top">
            <span className="stat-label">{label}</span>
            <i className={`mark mark-${mark} ${mark === 'square' && busy ? 'is-busy' : ''}`} aria-hidden />
          </div>
          <div className="stat-value">{value}</div>
          <div className="stat-sub">{sub}</div>
        </div>
      ))}
    </div>
  );
}
