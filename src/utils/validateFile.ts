import { extOf, SUPPORTED_EXTENSIONS } from './format';

export type RejectCode = 'format' | 'empty' | 'size' | 'name' | 'binary';

export interface Rejection {
  code: RejectCode;
  message: string;
}

// Caracteres reservados en nombres de archivo, de control o de marcado (<script>.csv, rutas, etc.)
const UNSAFE_NAME = /[<>:"/\\|?*\u0000-\u001f\u007f]/;
const SNIFF_BYTES = 4096;

// Firmas de formatos binarios habituales que llegan renombrados como texto
const SIGNATURES: [number[], string][] = [
  [[0x25, 0x50, 0x44, 0x46], 'un PDF'],
  [[0x50, 0x4b, 0x03, 0x04], 'un ZIP, XLSX o DOCX'],
  [[0x4d, 0x5a], 'un ejecutable de Windows'],
  [[0x7f, 0x45, 0x4c, 0x46], 'un ejecutable'],
  [[0x89, 0x50, 0x4e, 0x47], 'una imagen PNG'],
  [[0xff, 0xd8, 0xff], 'una imagen JPEG'],
  [[0x47, 0x49, 0x46, 0x38], 'una imagen GIF'],
  [[0x1f, 0x8b], 'un archivo comprimido GZIP'],
  [[0x52, 0x61, 0x72, 0x21], 'un archivo RAR'],
];

/**
 * Comprueba un archivo antes de subirlo. Devuelve el motivo del rechazo o null si se puede subir.
 * La API vuelve a validarlo; esto evita enviar archivos que sabemos que va a rechazar.
 */
export async function validateFile(file: File, maxMb: number): Promise<Rejection | null> {
  const name = file.name.trim();
  if (!name || name.length > 200 || UNSAFE_NAME.test(name) || name.startsWith('.') || name.includes('..')) {
    return { code: 'name', message: 'Nombre de archivo no válido: contiene caracteres no permitidos o es demasiado largo' };
  }

  const ext = extOf(name);
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return { code: 'format', message: ext ? `Formato no admitido: .${ext}` : 'El archivo no tiene extensión' };
  }
  if (file.size === 0) return { code: 'empty', message: 'El archivo está vacío' };
  if (file.size > maxMb * 1024 * 1024) return { code: 'size', message: `Supera el máximo de ${maxMb} MB` };

  const disguised = await sniffBinary(file);
  if (disguised) return { code: 'binary', message: `El contenido no es texto: parece ${disguised} con extensión .${ext}` };
  return null;
}

/** Lee los primeros bytes: firma binaria conocida o bytes nulos (que no aparecen en texto UTF-8). */
async function sniffBinary(file: File): Promise<string | null> {
  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  } catch {
    return null; // si no se puede leer, que decida la API
  }
  for (const [signature, label] of SIGNATURES) {
    if (signature.every((b, i) => bytes[i] === b)) return label;
  }
  const utf16 = (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);
  return !utf16 && bytes.includes(0) ? 'un archivo binario' : null;
}
