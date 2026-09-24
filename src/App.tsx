import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileItem, TrashItem } from './api/types';
import { useI18n, useOnLanguageChange } from './i18n';
import { useFiles } from './hooks/useFiles';
import { useTrash } from './hooks/useTrash';
import { useUploads } from './hooks/useUploads';
import { useTheme } from './hooks/useTheme';
import { useBackendStatus } from './hooks/useBackendStatus';
import { OfflineBanner } from './components/BackendStatus';
import { Sidebar, type View } from './components/Sidebar';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { UploadQueue } from './components/UploadQueue';
import { StatCards } from './components/StatCards';
import { FileList } from './components/FileList';
import { FileDetail } from './components/FileDetail';
import { TrashView } from './components/TrashView';
import { Connection } from './components/Connection';
import { Toasts, type Toast } from './components/Toasts';
import { daysUntil, inDays } from './utils/format';

type DetailMode = 'files' | 'trash';

export default function App() {
  const { t, locale } = useI18n();
  const [view, setView] = useState<View>('dashboard');
  const [openId, setOpenId] = useState<string | null>(null);
  // El modo se conserva al cerrar: el panel sigue mostrando el archivo durante la animación de salida
  // y no debe pedir su resultado al endpoint equivocado
  const [openMode, setOpenMode] = useState<DetailMode>('files');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme, setTheme } = useTheme();
  const backend = useBackendStatus();
  const { files, loading, error, refresh, moveToTrash, reprocess } = useFiles();
  const trash = useTrash();
  const uploads = useUploads(refresh);
  const uploading = uploads.tasks.filter((task) => task.state === 'uploading').length;

  const dismiss = useCallback((id: string) => setToasts((list) => list.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (text: string, tone: Toast['tone'] = 'ok', action?: Toast['action']) => {
      const id = crypto.randomUUID();
      setToasts((list) => [...list, { id, text, tone, action }]);
      // Con acción (Deshacer) se deja más tiempo para poder pulsarla
      setTimeout(() => dismiss(id), action ? 7000 : 3200);
    },
    [dismiss],
  );

  // Si falla la carga de archivos, comprobar al momento si la API sigue en pie
  const { check } = backend;
  useEffect(() => {
    if (error) void check();
  }, [error, check]);

  // Al cambiar de idioma se vuelve a pedir todo a la API para que sus mensajes (errores de procesado,
  // avisos) lleguen traducidos con el nuevo Accept-Language
  useOnLanguageChange(() => {
    void refresh();
    void trash.refresh();
    void check();
    toast(t('toasts.language'));
  });

  // Mantener el detalle sincronizado con el sondeo (del listado o de la papelera)
  const openFile = useMemo(() => {
    if (!openId) return null;
    const list: (FileItem | TrashItem)[] = openMode === 'trash' ? trash.items : files;
    return list.find((f) => f.id === openId) ?? null;
  }, [openId, openMode, files, trash.items]);
  const close = useCallback(() => setOpenId(null), []);

  const handleFiles = async (list: File[]) => {
    const result = await uploads.add(list);
    if (result.accepted) toast(t('toasts.uploading', { count: result.accepted }));
    if (result.rejected) toast(t('toasts.rejected', { count: result.rejected }), 'err');
    return result;
  };

  const handleRestore = async (id: string) => {
    try {
      await trash.restore(id);
      await refresh();
      toast(t('toasts.restored'));
      return true;
    } catch (e) {
      toast((e as Error).message, 'err');
      return false;
    }
  };

  const handleTrash = async (id: string) => {
    try {
      const item = await moveToTrash(id);
      trash.add(item);
      const days = daysUntil(item.purgeAt);
      toast(t('toasts.movedToTrash', { when: inDays(days, locale) }), 'ok', {
        label: t('toasts.undo'),
        onClick: () => void handleRestore(id),
      });
      return true;
    } catch (e) {
      toast((e as Error).message, 'err');
      return false;
    }
  };

  const handlePurge = async (id: string) => {
    try {
      await trash.purge(id);
      toast(t('toasts.purged'));
      return true;
    } catch (e) {
      toast((e as Error).message, 'err');
      return false;
    }
  };

  // Vaciar: la API no tiene borrado masivo, se purga uno a uno y se informa de cuántos se han eliminado
  const handleEmpty = async () => {
    let purged = 0;
    for (const item of [...trash.items]) {
      try {
        await trash.purge(item.id);
        purged++;
      } catch (e) {
        toast((e as Error).message, 'err');
      }
    }
    if (purged) toast(t('toasts.emptied', { count: purged }));
  };

  const handleReprocess = async (id: string) => {
    try {
      await reprocess(id);
      toast(t('toasts.reprocessQueued'));
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  const openIn = (mode: DetailMode) => (f: FileItem) => {
    setOpenMode(mode);
    setOpenId(f.id);
  };
  const openFromFiles = openIn('files');
  const openFromTrash = openIn('trash');

  return (
    <div className="app">
      <Sidebar view={view} onChange={setView} trashCount={trash.items.length} />
      <main className="main">
        <Header title={t(`app.${view}.title`)} subtitle={t(`app.${view}.subtitle`)} backend={backend} theme={theme} onTheme={setTheme} />

        <div className="content" key={view}>
          <OfflineBanner status={backend} />
          {view === 'dashboard' && (
            <div className="dash">
              <StatCards files={files} />
              <div className="dash-upload">
                <Dropzone onFiles={handleFiles} maxMb={uploads.maxMb} uploading={uploading} />
                <UploadQueue tasks={uploads.tasks} maxMb={uploads.maxMb} onCancel={uploads.cancel} onClear={uploads.clearFinished} />
              </div>
              <FileList
                title={t('files.recent')}
                files={files}
                loading={loading}
                error={error}
                limit={6}
                onOpen={openFromFiles}
                onRefresh={refresh}
                onSeeAll={() => setView('files')}
              />
            </div>
          )}

          {view === 'files' && (
            <FileList files={files} loading={loading} error={error} onOpen={openFromFiles} onRefresh={refresh} />
          )}

          {view === 'trash' && (
            <TrashView
              trash={trash}
              onOpen={openFromTrash}
              onRestore={async (id) => void (await handleRestore(id))}
              onPurge={async (id) => void (await handlePurge(id))}
              onEmpty={handleEmpty}
            />
          )}

          {view === 'connection' && <Connection backend={backend} />}
        </div>
      </main>

      <FileDetail
        file={openFile}
        mode={openMode}
        onClose={close}
        onTrash={handleTrash}
        onReprocess={handleReprocess}
        onRestore={handleRestore}
        onPurge={handlePurge}
      />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
