import type { FileItem, FileResult, HealthInfo } from './types';
import { mockApi } from './mock';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const BASE = '/api';
// La API traduce errores y avisos según Accept-Language (o ?language=); la interfaz está en español
const LANGUAGE = 'es';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const UNREACHABLE = 'No se pudo conectar con la API. Comprueba que está levantada.';

/** Mensaje para una respuesta de error: el ProblemDetails de ASP.NET Core o, si no lo hay, uno legible. */
function errorMessage(status: number, statusText: string, body: string): string {
  try {
    const problem = JSON.parse(body);
    if (problem.detail || problem.title) return problem.detail || problem.title;
  } catch {
    /* sin ProblemDetails */
  }
  // 502/503/504 sin ProblemDetails: el proxy de Vite (o nginx) no llega a la API
  if (status === 502 || status === 503 || status === 504) return UNREACHABLE;
  return `Error ${status}${statusText ? ` · ${statusText}` : ''}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers: { 'Accept-Language': LANGUAGE, ...init?.headers } });
  } catch {
    throw new ApiError(0, UNREACHABLE);
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
    xhr.setRequestHeader('Accept-Language', LANGUAGE);
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
    xhr.onerror = () => reject(new ApiError(0, UNREACHABLE));
    xhr.onabort = () => reject(new ApiError(0, 'Subida cancelada'));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}

const realApi = {
  listFiles: () => request<FileItem[]>('/files'),
  getFile: (id: string) => request<FileItem>(`/files/${id}`),
  getResult: (id: string) => request<FileResult>(`/files/${id}/result`),
  deleteFile: (id: string) => request<void>(`/files/${id}`, { method: 'DELETE' }),
  reprocess: (id: string) => request<FileItem>(`/files/${id}/reprocess`, { method: 'POST' }),
  upload: uploadWithProgress,
};

export type Api = typeof realApi;
export const api: Api = USE_MOCK ? mockApi : realApi;

export type BackendState = 'online' | 'degraded' | 'offline';

/**
 * Llamada rápida a /api/health contra la API real, también en modo demo, para saber si está levantada.
 * online: 200 y status "ok" · degraded: responde pero con 503 · offline: sin respuesta, error del proxy o timeout.
 */
export async function pingBackend(timeoutMs = 4000): Promise<{ state: BackendState; ms: number; version?: string }> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}/health`, {
      cache: 'no-store',
      headers: { 'Accept-Language': LANGUAGE },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ms = Math.round(performance.now() - t0);
    const body = (await res.json().catch(() => null)) as HealthInfo | null;
    if (res.ok && body?.status === 'ok') return { state: 'online', ms, version: body.version };
    if (res.status === 503 && body) return { state: 'degraded', ms, version: body.version };
    return { state: 'offline', ms };
  } catch {
    return { state: 'offline', ms: Math.round(performance.now() - t0) };
  }
}
