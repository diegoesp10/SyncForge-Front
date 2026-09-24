import { useEffect, useRef, useState, type DragEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import type { AddResult } from '../hooks/useUploads';
import { useI18n } from '../i18n';
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
  const { t } = useI18n();
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

  const showRejected = rejected && !over;
  const [line1, line2] = over
    ? [t('dropzone.overTitle'), t('dropzone.overEm')]
    : rejected
      ? rejected.count === 1
        ? [t(rejected.total === 1 ? 'dropzone.rejectedSingle' : 'dropzone.rejectedOneOfMany'), t('dropzone.notAllowedOne')]
        : [t(rejected.count === rejected.total ? 'dropzone.rejectedAll' : 'dropzone.rejectedSome'), t('dropzone.notAllowedMany')]
      : [t('dropzone.title'), t('dropzone.titleEm')];

  return (
    <div
      className={`dropzone ${over ? 'is-over' : ''} ${uploading ? 'is-uploading' : ''} ${showRejected ? 'is-rejected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={t('dropzone.aria')}
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
          <span className="eyebrow">{t(showRejected ? 'dropzone.eyebrowRejected' : 'dropzone.eyebrow')}</span>
          <p className="dz-title">{line1}<br /><em>{line2}</em></p>
          <p className="dz-hint" aria-live="polite">
            {showRejected
              ? t('dropzone.rejectedHint', { rejected: rejected.count, count: rejected.total })
              : t('dropzone.hint', { formats: SUPPORTED_EXTENSIONS.join(', ').toUpperCase(), max: maxMb })}
          </p>
          <span className="btn-primary dz-btn" aria-hidden>
            {uploading ? (
              <>
                <Loader size="sm" label={t('dropzone.uploadingAria')} /> {t('dropzone.uploading', { count: uploading })}
              </>
            ) : (
              <>
                <ArrowUp size={16} /> {t('dropzone.select')}
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
