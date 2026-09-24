import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, USE_MOCK } from './api/client';
import type { FileItem } from './api/types';
import { useFiles } from './hooks/useFiles';
import { useUploads } from './hooks/useUploads';
import { useTheme } from './hooks/useTheme';
import { Sidebar, type View } from './components/Sidebar';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { UploadQueue } from './components/UploadQueue';
import { StatCards } from './components/StatCards';
import { FileList } from './components/FileList';
import { FileDetail } from './components/FileDetail';
import { Connection } from './components/Connection';
import { Toasts, type Toast } from './components/Toasts';

const titles: Record<View, [string, string]> = {
  dashboard: ['Panel', 'Sube archivos y deja que el backend haga el resto'],
  files: ['Archivos', 'Todo lo que has subido y su estado de procesado'],
  connection: ['Conexión', 'Estado del API y contrato de endpoints'],
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [openId, setOpenId] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string>();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { theme, setTheme } = useTheme();
  const { files, loading, error, refresh, remove, reprocess } = useFiles();
  const uploads = useUploads(refresh);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  useEffect(() => {
    const check = () =>
      api.health().then(
        (h) => {
          setOnline(h.status === 'ok');
          setVersion(h.version);
        },
        () => setOnline(false),
      );
    check();
    const t = setInterval(check, 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (error) setOnline(false);
  }, [error]);

  // Mantener el detalle sincronizado con el sondeo
  const openFile = useMemo(() => files.find((f) => f.id === openId) ?? null, [files, openId]);
  const open = (f: FileItem) => setOpenId(f.id);
  const close = useCallback(() => setOpenId(null), []);

  const handleFiles = (list: File[]) => {
    uploads.add(list);
    toast(list.length === 1 ? `Subiendo ${list[0].name}` : `Subiendo ${list.length} archivos`);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast('Archivo eliminado');
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await reprocess(id);
      toast('Enviado a reprocesar');
    } catch (e) {
      toast((e as Error).message, 'err');
    }
  };

  const [title, subtitle] = titles[view];

  return (
    <div className="app">
      <Sidebar view={view} onChange={setView} />
      <main className="main">
        <Header title={title} subtitle={subtitle} online={online} mock={USE_MOCK} theme={theme} onTheme={setTheme} />

        <div className="content" key={view}>
          {view === 'dashboard' && (
            <div className="dash">
              <StatCards files={files} />
              <div className="dash-upload">
                <Dropzone onFiles={handleFiles} maxMb={uploads.maxMb} />
                <UploadQueue tasks={uploads.tasks} onCancel={uploads.cancel} onClear={uploads.clearFinished} />
              </div>
              <FileList
                title="Recientes"
                files={files}
                loading={loading}
                limit={6}
                onOpen={open}
                onRefresh={refresh}
                onSeeAll={() => setView('files')}
              />
            </div>
          )}

          {view === 'files' && (
            <FileList files={files} loading={loading} onOpen={open} onRefresh={refresh} />
          )}

          {view === 'connection' && <Connection online={online} mock={USE_MOCK} version={version} />}
        </div>
      </main>

      <FileDetail file={openFile} onClose={close} onDelete={handleDelete} onReprocess={handleReprocess} />
      <Toasts toasts={toasts} />
    </div>
  );
}
