import type { Translate } from '../i18n';
import { extOf, SUPPORTED_EXTENSIONS } from './format';

export type RejectCode = 'format' | 'empty' | 'size' | 'name' | 'binary';
export type BinaryKind = 'pdf' | 'zip' | 'exe' | 'elf' | 'png' | 'jpeg' | 'gif' | 'gzip' | 'rar' | 'binary';

/** Motivo del rechazo, sin texto: el mensaje se traduce al pintarlo (rejectionMessage) según el idioma activo. */
export interface Rejection {
  code: RejectCode;
  ext?: string;
  kind?: BinaryKind;
  max?: number;
}

// Caracteres reservados en nombres de archivo, de control o de marcado (<script>.csv, rutas, etc.)
const UNSAFE_NAME = /[<>:"/\\|?*\u0000-\u001f\u007f]/;
const SNIFF_BYTES = 4096;

// Firmas de formatos binarios habituales que llegan renombrados como texto
const SIGNATURES: [number[], BinaryKind][] = [
  [[0x25, 0x50, 0x44, 0x46], 'pdf'],
  [[0x50, 0x4b, 0x03, 0x04], 'zip'],
  [[0x4d, 0x5a], 'exe'],
  [[0x7f, 0x45, 0x4c, 0x46], 'elf'],
  [[0x89, 0x50, 0x4e, 0x47], 'png'],
  [[0xff, 0xd8, 0xff], 'jpeg'],
  [[0x47, 0x49, 0x46, 0x38], 'gif'],
  [[0x1f, 0x8b], 'gzip'],
  [[0x52, 0x61, 0x72, 0x21], 'rar'],
];

/**
 * Comprueba un archivo antes de subirlo. Devuelve el motivo del rechazo o null si se puede subir.
 * La API vuelve a validarlo; esto evita enviar archivos que sabemos que va a rechazar.
 */
export async function validateFile(file: File, maxMb: number): Promise<Rejection | null> {
  const name = file.name.trim();
  if (!name || name.length > 200 || UNSAFE_NAME.test(name) || name.startsWith('.') || name.includes('..')) {
    return { code: 'name' };
  }

  const ext = extOf(name);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) return { code: 'format', ext };
  if (file.size === 0) return { code: 'empty' };
  if (file.size > maxMb * 1024 * 1024) return { code: 'size', max: maxMb };

  const kind = await sniffBinary(file);
  return kind ? { code: 'binary', kind, ext } : null;
}

/** Texto del rechazo en el idioma activo. */
export function rejectionMessage(r: Rejection, t: Translate): string {
  switch (r.code) {
    case 'format':
      return r.ext ? t('reject.format', { ext: r.ext }) : t('reject.noExtension');
    case 'size':
      return t('reject.size', { max: r.max ?? 0 });
    case 'binary':
      return t('reject.binary', { kind: t(`reject.kinds.${r.kind ?? 'binary'}`), ext: r.ext ?? '' });
    default:
      return t(`reject.${r.code}`);
  }
}

/** Lee los primeros bytes: firma binaria conocida o bytes nulos (que no aparecen en texto UTF-8). */
async function sniffBinary(file: File): Promise<BinaryKind | null> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  } catch {
    return null; // si no se puede leer, que decida la API
  }
  for (const [signature, kind] of SIGNATURES) {
    if (signature.every((b, i) => bytes[i] === b)) return kind;
  }
  const utf16 = (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);
  return !utf16 && bytes.includes(0) ? 'binary' : null;
}
