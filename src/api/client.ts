import type { FileItem, FileResult, HealthInfo, TrashItem } from './types';
import type { Lang, MessageKey, Translate } from '../i18n';

const BASE = '/api';

// Idioma y traductor activos. Los fija I18nProvider (configureApi) cada vez que cambia el idioma:
// la API traduce errores y avisos según Accept-Language (ApiLanguage.Resolve en el backend).
let language: Lang = 'es';
let translate: Translate = (key) => key;

export function configureApi(lang: Lang, t: Translate) {
  language = lang;
  translate = t;
}

const headers = () => ({ 'Accept-Language': language });

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const unreachable = () => translate('errors.unreachable');

// Mensajes propios para respuestas sin ProblemDetails (p. ej. un 413 de Kestrel o un 502 del proxy)
const FALLBACKS: Partial<Record<number, MessageKey>> = {
  400: 'errors.400',
  404: 'errors.404',
  409: 'errors.409',
  413: 'errors.413',
  415: 'errors.415',
  502: 'errors.unreachable',
  503: 'errors.unreachable',
  504: 'errors.unreachable',
};

/** Mensaje para una respuesta de error: el ProblemDetails de ASP.NET Core (ya traducido por la API) o uno propio. */
function errorMessage(status: number, statusText: string, body: string): string {
  try {
    const problem = JSON.parse(body);
    const text = [problem?.detail, problem?.title].find((v) => typeof v === 'string' && v.trim());
    // Solo texto, recortado: nunca se pinta como HTML (React lo escapa) ni se vuelca una respuesta enorme
    if (text) return text.trim().slice(0, 300);
  } catch {
    /* sin ProblemDetails */
  }
  const fallback = FALLBACKS[status];
  if (fallback) return translate(fallback);
  return `${translate('errors.generic', { status })}${statusText ? ` · ${statusText}` : ''}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(), ...init?.headers } });
  } catch {
    throw new ApiError(0, unreachable());
  }
  if (!res.ok) throw new ApiError(res.status, errorMessage(res.status, res.statusText, await res.text()));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Subida con XHR para poder mostrar el progreso real de envío. */
function uploadWithProgress(
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<FileItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file, file.name);

    xhr.open('POST', `${BASE}/files`);
    xhr.setRequestHeader('Accept-Language', language);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new ApiError(xhr.status, errorMessage(xhr.status, xhr.statusText, xhr.responseText)));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, unreachable()));
    xhr.onabort = () => reject(new ApiError(0, translate('uploads.cancelled')));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}

export const api = {
  listFiles: () => request<FileItem[]>('/files'),
  getFile: (id: string) => request<FileItem>(`/files/${id}`),
  getResult: (id: string) => request<FileResult>(`/files/${id}/result`),
  reprocess: (id: string) => request<FileItem>(`/files/${id}/reprocess`, { method: 'POST' }),
  upload: uploadWithProgress,

  // Papelera (TrashCanController): el archivo sale de /files y se elimina solo a los 30 días
  moveToTrash: (id: string) => request<TrashItem>(`/trash-can/${id}`, { method: 'POST' }),
  listTrash: () => request<TrashItem[]>('/trash-can'),
  getTrashResult: (id: string) => request<FileResult>(`/trash-can/${id}/result`),
  restore: (id: string) => request<FileItem>(`/trash-can/${id}/restore`, { method: 'POST' }),
  purge: (id: string) => request<void>(`/trash-can/${id}`, { method: 'DELETE' }),
};

export type BackendState = 'online' | 'degraded' | 'offline';

/**
 * Llamada rápida a /api/health para saber si la API está levantada.
 * online: 200 y status "ok" · degraded: responde pero con 503 · offline: sin respuesta, error del proxy o timeout.
 */
export async function pingBackend(timeoutMs = 4000): Promise<{ state: BackendState; ms: number; version?: string }> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}/health`, { cache: 'no-store', headers: headers(), signal: AbortSignal.timeout(timeoutMs) });
    const ms = Math.round(performance.now() - t0);
    const body = (await res.json().catch(() => null)) as HealthInfo | null;
    if (res.ok && body?.status === 'ok') return { state: 'online', ms, version: body.version };
    if (res.status === 503 && body) return { state: 'degraded', ms, version: body.version };
    return { state: 'offline', ms };
  } catch {
    return { state: 'offline', ms: Math.round(performance.now() - t0) };
  }
}
