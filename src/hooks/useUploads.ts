import { useCallback, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import { validateFile, type Rejection } from '../utils/validateFile';

export interface UploadTask {
  key: string;
  file: File;
  progress: number;
  /** rejected: lo descartó la validación del frontal · error: lo rechazó la API o falló la conexión */
  state: 'uploading' | 'done' | 'error' | 'rejected';
  /** Mensaje de la API (ya en el idioma pedido) o de conexión */
  error?: string;
  /** Motivo del rechazo del frontal; se traduce al pintarlo */
  rejection?: Rejection;
  /** Código HTTP devuelto por la API (0 si no hubo respuesta) */
  status?: number;
}

export interface AddResult {
  accepted: number;
  rejected: number;
}

const MAX_MB = Number(import.meta.env.VITE_MAX_FILE_MB ?? 50);
const CONCURRENCY = 3;

export function useUploads(onUploaded: () => void) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const queue = useRef<UploadTask[]>([]);
  const active = useRef(0);

  const patch = (key: string, p: Partial<UploadTask>) =>
    setTasks((ts) => ts.map((t) => (t.key === key ? { ...t, ...p } : t)));

  const pump = useCallback(() => {
    while (active.current < CONCURRENCY && queue.current.length) {
      const task = queue.current.shift()!;
      const ctrl = new AbortController();
      controllers.current.set(task.key, ctrl);
      active.current++;
      api
        .upload(task.file, (progress) => patch(task.key, { progress }), ctrl.signal)
        .then(() => {
          patch(task.key, { state: 'done', progress: 100 });
          onUploaded();
          setTimeout(() => setTasks((ts) => ts.filter((t) => t.key !== task.key)), 2500);
        })
        .catch((e: unknown) =>
          patch(task.key, {
            state: 'error',
            error: e instanceof Error ? e.message : String(e),
            status: e instanceof ApiError ? e.status : undefined,
          }),
        )
        .finally(() => {
          controllers.current.delete(task.key);
          active.current--;
          pump();
        });
    }
  }, [onUploaded]);

  /** Valida cada archivo y solo encola los admitidos; los demás quedan en la lista con su motivo. */
  const add = useCallback(
    async (files: File[]): Promise<AddResult> => {
      const checked = await Promise.all(files.map(async (file) => ({ file, rejection: await validateFile(file, MAX_MB) })));
      const created: UploadTask[] = checked.map(({ file, rejection }) => ({
        key: crypto.randomUUID(),
        file,
        progress: 0,
        state: rejection ? 'rejected' : 'uploading',
        rejection: rejection ?? undefined,
      }));
      setTasks((ts) => [...created, ...ts]);
      queue.current.push(...created.filter((t) => t.state === 'uploading'));
      pump();
      const accepted = created.filter((t) => t.state === 'uploading').length;
      return { accepted, rejected: created.length - accepted };
    },
    [pump],
  );

  const cancel = useCallback((key: string) => {
    const ctrl = controllers.current.get(key);
    if (ctrl) ctrl.abort();
    queue.current = queue.current.filter((t) => t.key !== key);
    setTasks((ts) => ts.filter((t) => t.key !== key));
  }, []);

  const clearFinished = useCallback(() => setTasks((ts) => ts.filter((t) => t.state === 'uploading')), []);

  return { tasks, add, cancel, clearFinished, maxMb: MAX_MB };
}
