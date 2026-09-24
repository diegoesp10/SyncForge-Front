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

// Un formateador por idioma ("hace 5 minutos" / "5 minutes ago")
const relative = new Map<string, Intl.RelativeTimeFormat>();
function rtf(locale: string) {
  let f = relative.get(locale);
  if (!f) relative.set(locale, (f = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })));
  return f;
}

export function timeAgo(iso: string | number, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return rtf(locale).format(0, 'second');
  if (abs < 3600) return rtf(locale).format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf(locale).format(Math.round(diff / 3600), 'hour');
  return rtf(locale).format(Math.round(diff / 86400), 'day');
}

export function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Solo el día: "24 de octubre de 2026" / "24 October 2026" */
export function formatDay(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

const DAY_MS = 86_400_000;

/** Días (redondeados hacia arriba) que faltan hasta una fecha; 0 o menos si ya ha pasado */
export function daysUntil(iso: string, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY_MS);
}

/** "mañana", "dentro de 29 días" / "tomorrow", "in 29 days" */
export function inDays(days: number, locale: string): string {
  return rtf(locale).format(days, 'day');
}

export function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

// Extensiones que analiza el backend; cualquier otra termina en Failed (formato no soportado)
export const SUPPORTED_EXTENSIONS = ['csv', 'tsv', 'json', 'txt', 'log', 'xml', 'md'];

export type FileFamily = 'table' | 'code' | 'text' | 'sheet' | 'other';

export function familyOf(name: string): FileFamily {
  const e = extOf(name);
  if (['csv', 'tsv'].includes(e)) return 'table';
  if (['json', 'xml', 'yaml', 'yml'].includes(e)) return 'code';
  if (['txt', 'log', 'md'].includes(e)) return 'text';
  if (['xlsx', 'xls', 'ods'].includes(e)) return 'sheet';
  return 'other';
}
