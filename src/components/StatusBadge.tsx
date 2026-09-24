import type { FileStatus } from '../api/types';

const labels: Record<FileStatus, string> = {
  Pending: 'En cola',
  Processing: 'Procesando',
  Completed: 'Completado',
  Failed: 'Error',
};

export function StatusBadge({ status, progress }: { status: FileStatus; progress?: number | null }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <i className="badge-dot" aria-hidden />
      {labels[status]}
      {status === 'Processing' && progress != null && <span className="badge-pct">{progress}%</span>}
    </span>
  );
}

export const statusLabels = labels;
