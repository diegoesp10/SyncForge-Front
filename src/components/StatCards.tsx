import type { FileItem } from '../api/types';
import { useI18n } from '../i18n';
import { formatBytes } from '../utils/format';

export function StatCards({ files }: { files: FileItem[] }) {
  const { t, locale } = useI18n();
  const busy = files.filter((f) => f.status === 'Pending' || f.status === 'Processing').length;
  const done = files.filter((f) => f.status === 'Completed').length;
  const failed = files.filter((f) => f.status === 'Failed').length;
  const total = files.reduce((s, f) => s + f.size, 0);
  const items = [
    { label: t('stats.files'), value: files.length, sub: formatBytes(total), mark: 'circle', tone: 'accent' },
    { label: t('stats.processing'), value: busy, sub: busy ? t('stats.working') : t('stats.idle'), mark: 'square', tone: 'ochre' },
    {
      label: t('stats.completed'),
      value: done,
      sub: files.length ? t('stats.ofTotal', { percent: Math.round((done / files.length) * 100) }) : '—',
      mark: 'half',
      tone: 'ok',
    },
    { label: t('stats.failed'), value: failed, sub: failed ? t('stats.review') : t('stats.allGood'), mark: 'tri', tone: 'err' },
  ];
  return (
    <div className="stats">
      {items.map(({ label, value, sub, mark, tone }) => (
        <div key={tone} className={`stat tone-${tone}`}>
          <div className="stat-top">
            <span className="stat-label">{label}</span>
            <i className={`mark mark-${mark} ${mark === 'square' && busy ? 'is-busy' : ''}`} aria-hidden />
          </div>
          <div className="stat-value">{value.toLocaleString(locale)}</div>
          <div className="stat-sub">{sub}</div>
        </div>
      ))}
    </div>
  );
}
