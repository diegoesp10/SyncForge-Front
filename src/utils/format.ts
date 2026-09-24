export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function timeAgo(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'ahora mismo';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export type FileFamily = 'table' | 'code' | 'text' | 'sheet' | 'other';

export function familyOf(name: string): FileFamily {
  const e = extOf(name);
  if (['csv', 'tsv'].includes(e)) return 'table';
  if (['json', 'xml', 'yaml', 'yml'].includes(e)) return 'code';
  if (['txt', 'log', 'md'].includes(e)) return 'text';
  if (['xlsx', 'xls', 'ods'].includes(e)) return 'sheet';
  return 'other';
}
