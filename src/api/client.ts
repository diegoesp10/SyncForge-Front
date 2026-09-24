import type { FileItem, FileResult, HealthInfo } from './types';
import { mockApi } from './mock';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      // ProblemDetails de ASP.NET Core
      const body = await res.json();
      msg = body.detail || body.title || msg;
    } catch {
      /* cuerpo vacío */
    }
    throw new ApiError(res.status, msg);
  }
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
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        let msg = `${xhr.status} ${xhr.statusText}`;
        try {
          const b = JSON.parse(xhr.responseText);
          msg = b.detail || b.title || msg;
        } catch {
          /* noop */
        }
        reject(new ApiError(xhr.status, msg));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'No se pudo conectar con el backend'));
    xhr.onabort = () => reject(new ApiError(0, 'Subida cancelada'));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
  });
}

const realApi = {
  health: () => request<HealthInfo>('/health'),
  listFiles: () => request<FileItem[]>('/files'),
  getFile: (id: string) => request<FileItem>(`/files/${id}`),
  getResult: (id: string) => request<FileResult>(`/files/${id}/result`),
  deleteFile: (id: string) => request<void>(`/files/${id}`, { method: 'DELETE' }),
  reprocess: (id: string) => request<FileItem>(`/files/${id}/reprocess`, { method: 'POST' }),
  upload: uploadWithProgress,
};

export type Api = typeof realApi;
export const api: Api = USE_MOCK ? mockApi : realApi;
