import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import type { FileItem } from '../api/types';

/** Lista de archivos con sondeo: rápido (1 s) si hay algo en cola/procesando, lento (8 s) si no. */
export function useFiles() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    window.clearTimeout(timer.current);
    let busy = false;
    try {
      const list = await api.listFiles();
      if (!alive.current) return;
      setFiles(list);
      setError(null);
      busy = list.some((f) => f.status === 'Pending' || f.status === 'Processing');
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : 'Error al cargar archivos');
    } finally {
      setLoading(false);
    }
    // Cada refresco (también los manuales o tras una subida) reprograma el siguiente
    window.clearTimeout(timer.current);
    if (alive.current) timer.current = window.setTimeout(refresh, busy ? 1000 : 8000);
  }, []);

  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await api.deleteFile(id);
    setFiles((fs) => fs.filter((f) => f.id !== id));
  }, []);

  const reprocess = useCallback(async (id: string) => {
    await api.reprocess(id);
    await refresh();
  }, [refresh]);

  return { files, loading, error, refresh, remove, reprocess };
}
