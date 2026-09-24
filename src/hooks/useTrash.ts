import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { TrashItem } from '../api/types';

const REFRESH_MS = 60000;
const byMovedDesc = (a: TrashItem, b: TrashItem) => b.movedAt.localeCompare(a.movedAt);

/**
 * Contenido de la papelera. Se recarga cada minuto porque la API purga sola los archivos caducados
 * (TrashCanCleanupWorker) y así desaparecen también de aquí.
 */
export function useTrash() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await api.listTrash();
      setItems([...list].sort(byMovedDesc));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  /** Añade la entrada que devuelve la API al mover un archivo, sin esperar a la siguiente recarga */
  const add = useCallback((item: TrashItem) => setItems((xs) => [item, ...xs.filter((x) => x.id !== item.id)].sort(byMovedDesc)), []);

  const restore = useCallback(async (id: string) => {
    const file = await api.restore(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
    return file;
  }, []);

  const purge = useCallback(async (id: string) => {
    await api.purge(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  return { items, loading, error, refresh, add, restore, purge };
}

export type Trash = ReturnType<typeof useTrash>;
