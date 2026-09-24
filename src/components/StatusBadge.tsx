import type { FileStatus } from '../api/types';
import { useI18n } from '../i18n';

export function StatusBadge({ status, progress }: { status: FileStatus; progress?: number | null }) {
  const { t } = useI18n();
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <i className="badge-dot" aria-hidden />
      {t(`status.${status}`)}
      {status === 'Processing' && progress != null && <span className="badge-pct">{progress}%</span>}
    </span>
  );
}
