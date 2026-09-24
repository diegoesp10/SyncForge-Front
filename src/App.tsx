import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FileItem } from './api/types';
import { useI18n, useOnLanguageChange } from './i18n';
import { useFiles } from './hooks/useFiles';
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
import { Connection } from './components/Connection';
import { Toasts, type Toast } from './components/Toasts';

export default function App() {
  const { t } = useI18n();
  const [view, setView] = useState<View>('dashboard');
  const [openId, setOpenId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme, setTheme } = useTheme();
  const backend = useBackendStatus();
  const { files, loading, error, refresh, remove, reprocess } = useFiles();
  const uploads = useUploads(refresh);
  const uploading = uploads.tasks.filter((task) => task.state === 'uploading').length;

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = crypto.randomUUID();
    setToasts((list) => [...list, { id, text, tone }]);
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3200);
  }, []);

  // Si falla la carga de archivos, comprobar al momento si la API sigue en pie
  const { check } = backend;
  useEffect(() => {
    if (error) void check();
  }, [error, check]);

  // Al cambiar de idioma se vuelve a pedir todo a la API para que sus mensajes (errores de procesado,
  // avisos) lleguen traducidos con el nuevo Accept-Language
  useOnLanguageChange(() => {
    void refresh();
    void check();
    toast(t('toasts.language'));
  });

  // Mantener el detalle sincronizado con el sondeo
  const openFile = useMemo(() => files.find((f) => f.id === openId) ?? null, [files, openId]);
  const open = (f: FileItem) => setOpenId(f.id);
  const close = useCallback(() => setOpenId(null), []);

  const handleFiles = async (list: File[]) => {
    const result = await uploads.add(list);
    if (result.accepted) toast(t('toasts.uploading', { count: result.accepted }));
    if (result.rejected) toast(t('toasts.rejected', { count: result.rejected }), 'err');
    return result;
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast(t('toasts.deleted'));
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await reprocess(id);
      toast(t('toasts.reprocessQueued'));
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  return (
    <div className="app">
      <Sidebar view={view} onChange={setView} />
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
                onOpen={open}
                onRefresh={refresh}
                onSeeAll={() => setView('files')}
              />
            </div>
          )}

          {view === 'files' && (
            <FileList files={files} loading={loading} error={error} onOpen={open} onRefresh={refresh} />
          )}

          {view === 'connection' && <Connection backend={backend} />}
        </div>
      </main>

      <FileDetail file={openFile} onClose={close} onDelete={handleDelete} onReprocess={handleReprocess} />
      <Toasts toasts={toasts} />
    </div>
  );
}
