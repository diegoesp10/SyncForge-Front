import type { FileItem, FileResult, HealthInfo } from './types';

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
const FALLBACKS: Record<number, string> = {
  400: 'La API ha rechazado la petición por no ser válida.',
  404: 'El archivo ya no existe en la API.',
  409: 'La operación no es posible en el estado actual del archivo.',
  413: 'El archivo supera el tamaño máximo que admite la API.',
  415: 'La API no admite este tipo de contenido.',
  502: UNREACHABLE,
  503: UNREACHABLE,
  504: UNREACHABLE,
};

function errorMessage(status: number, statusText: string, body: string): string {
  try {
    const problem = JSON.parse(body);
    const text = [problem?.detail, problem?.title].find((v) => typeof v === 'string' && v.trim());
    // Solo texto, recortado: nunca se pinta como HTML (React lo escapa) ni se vuelca una respuesta enorme
    if (text) return text.trim().slice(0, 300);
  } catch {
    /* sin ProblemDetails */
  }
  return FALLBACKS[status] ?? `Error ${status}${statusText ? ` · ${statusText}` : ''}`;
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

export const api = {
  listFiles: () => request<FileItem[]>('/files'),
  getFile: (id: string) => request<FileItem>(`/files/${id}`),
  getResult: (id: string) => request<FileResult>(`/files/${id}/result`),
  deleteFile: (id: string) => request<void>(`/files/${id}`, { method: 'DELETE' }),
  reprocess: (id: string) => request<FileItem>(`/files/${id}/reprocess`, { method: 'POST' }),
  upload: uploadWithProgress,
};


export type BackendState = 'online' | 'degraded' | 'offline';

/**
 * Llamada rápida a /api/health para saber si la API está levantada.
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
