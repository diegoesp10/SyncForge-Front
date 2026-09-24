import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import type { AddResult } from '../hooks/useUploads';
import { Composition } from './Composition';
import { Loader } from './Loader';
import { SUPPORTED_EXTENSIONS } from '../utils/format';

interface Props {
  onFiles: (files: File[]) => Promise<AddResult>;
  maxMb: number;
  /** Subidas en curso: el botón muestra el loader mientras haya alguna */
  uploading?: number;
}

const REJECT_FLASH_MS = 2800;

export function Dropzone({ onFiles, maxMb, uploading = 0 }: Props) {
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<{ count: number; total: number } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const submit = async (files: File[]) => {
    if (!files.length) return;
    const { rejected: count } = await onFiles(files);
    window.clearTimeout(flashTimer.current);
    if (!count) return setRejected(null);
    // Aviso visual en la propia zona de subida; el motivo de cada archivo queda en la lista de Subidas
    setRejected({ count, total: files.length });
    flashTimer.current = window.setTimeout(() => setRejected(null), REJECT_FLASH_MS);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    void submit(Array.from(e.dataTransfer.files));
  };

  const title = over ? (
    <>Suéltalos<br /><em>aquí mismo.</em></>
  ) : rejected ? (
    rejected.count === 1 ? (
      <>{rejected.total === 1 ? 'Archivo' : 'Un archivo'}<br /><em>no admitido.</em></>
    ) : (
      <>{rejected.count === rejected.total ? 'Archivos' : 'Algunos archivos'}<br /><em>no admitidos.</em></>
    )
  ) : (
    <>Arrastra tus archivos<br /><em>o selecciónalos.</em></>
  );

  return (
    <div
      className={`dropzone ${over ? 'is-over' : ''} ${uploading ? 'is-uploading' : ''} ${rejected && !over ? 'is-rejected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Subir archivos"
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current--;
        if (depth.current <= 0) setOver(false);
      }}
      onDrop={handleDrop}
    >
      <div className="dz-inner">
        <div className="dz-copy">
          <span className="eyebrow">{rejected && !over ? 'Subida rechazada' : 'Nueva subida'}</span>
          <p className="dz-title">{title}</p>
          <p className="dz-hint" aria-live="polite">
            {rejected && !over
              ? `${rejected.count} de ${rejected.total} ${rejected.total === 1 ? 'archivo no cumple' : 'archivos no cumplen'} los requisitos. Revisa el motivo en Subidas.`
              : `${SUPPORTED_EXTENSIONS.join(', ').toUpperCase()} · hasta ${maxMb} MB por archivo`}
          </p>
          <span className="btn-primary dz-btn" aria-hidden>
            {uploading ? (
              <>
                <Loader size="sm" label="Subiendo" /> Subiendo {uploading} {uploading === 1 ? 'archivo' : 'archivos'}…
              </>
            ) : (
              <>
                <ArrowUp size={16} /> Seleccionar archivos
              </>
            )}
          </span>
        </div>
        <Composition preset="upload" className="dz-art" />
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(',')}
        hidden
        onChange={(e) => {
          void submit(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
    </div>
  );
}
