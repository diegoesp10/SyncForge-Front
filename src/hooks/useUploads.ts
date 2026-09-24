import { useCallback, useRef, useState } from 'react';
import { api } from '../api/client';

export interface UploadTask {
  key: string;
  file: File;
  progress: number;
  state: 'uploading' | 'done' | 'error';
  error?: string;
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
        .catch((e: Error) => patch(task.key, { state: 'error', error: e.message }))
        .finally(() => {
          controllers.current.delete(task.key);
          active.current--;
          pump();
        });
    }
  }, [onUploaded]);

  const add = useCallback(
    (files: File[]) => {
      const created: UploadTask[] = files.map((file) => {
        const tooBig = file.size > MAX_MB * 1024 * 1024;
        return {
          key: crypto.randomUUID(),
          file,
          progress: 0,
          state: tooBig ? 'error' : 'uploading',
          error: tooBig ? `Supera el máximo de ${MAX_MB} MB` : undefined,
        };
      });
      setTasks((ts) => [...created, ...ts]);
      queue.current.push(...created.filter((t) => t.state === 'uploading'));
      pump();
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
