import { useRef, useState, type DragEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { Composition } from './Composition';

interface Props {
  onFiles: (files: File[]) => void;
  maxMb: number;
}

export function Dropzone({ onFiles, maxMb }: Props) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      className={`dropzone ${over ? 'is-over' : ''}`}
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
          <span className="eyebrow">Nueva subida</span>
          <p className="dz-title">
            {over ? <>Suéltalos<br /><em>aquí mismo.</em></> : <>Arrastra tus archivos<br /><em>o selecciónalos.</em></>}
          </p>
          <p className="dz-hint">CSV, JSON, TXT, XML, XLSX… · hasta {maxMb} MB por archivo</p>
          <span className="btn-primary dz-btn" aria-hidden>
            <ArrowUp size={16} /> Seleccionar archivos
          </span>
        </div>
        <Composition preset="upload" className="dz-art" />
      </div>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
