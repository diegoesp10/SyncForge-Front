// Backend simulado: permite levantar el frontal sin el API .NET.
// Lee de verdad el archivo en el navegador (CSV/JSON/texto) para que la vista previa sea realista.
import type { FileItem, FileResult } from './types';
import type { Api } from './client';

interface Entry {
  item: FileItem;
  result?: FileResult;
  file?: File;
}

const store = new Map<string, Entry>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = () => crypto.randomUUID();

function seed() {
  const now = Date.now();
  const samples: [string, string, number, FileItem['status'], number][] = [
    ['ventas_2026_Q2.csv', 'text/csv', 482_133, 'Completed', 1000 * 60 * 42],
    ['clientes_export.json', 'application/json', 91_870, 'Completed', 1000 * 60 * 60 * 5],
    ['inventario_almacen.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1_204_551, 'Failed', 1000 * 60 * 60 * 26],
  ];
  for (const [fileName, contentType, size, status, ago] of samples) {
    const id = uid();
    const uploadedAt = new Date(now - ago).toISOString();
    store.set(id, {
      item: {
        id, fileName, contentType, size, status, uploadedAt,
        processedAt: status === 'Completed' ? new Date(now - ago + 3200).toISOString() : null,
        error: status === 'Failed' ? 'Formato no soportado todavía: .xlsx' : null,
      },
      result: status === 'Completed' ? sampleResult(id, fileName) : undefined,
    });
  }
}

function sampleResult(id: string, name: string): FileResult {
  if (name.endsWith('.json')) {
    const json = [
      { id: 1, nombre: 'Acme S.L.', ciudad: 'Oviedo', activo: true },
      { id: 2, nombre: 'Nortesur S.A.', ciudad: 'Gijón', activo: false },
    ];
    return { fileId: id, summary: { rows: 2, encoding: 'UTF-8', durationMs: 214 }, preview: { kind: 'json', json } };
  }
  const columns = ['fecha', 'producto', 'unidades', 'importe'];
  const rows = Array.from({ length: 24 }, (_, i) => [
    `2026-0${4 + (i % 3)}-${String(1 + i).padStart(2, '0')}`,
    ['Licencia Pro', 'Soporte anual', 'Formación', 'Consultoría'][i % 4],
    (i * 7) % 40 + 1,
    Number(((i * 137.5) % 2400 + 99).toFixed(2)),
  ]);
  return {
    fileId: id,
    summary: { rows: 12_480, columns: 4, encoding: 'UTF-8', durationMs: 1832 },
    preview: { kind: 'table', columns, rows },
    warnings: ['3 filas con importe vacío se han ignorado'],
  };
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  const sep = [';', ',', '\t'].reduce((best, s) =>
    (lines[0]?.split(s).length ?? 0) > (lines[0]?.split(best).length ?? 0) ? s : best, ',');
  const split = (l: string) => l.split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
  const columns = split(lines[0] ?? '');
  const rows = lines.slice(1, 201).map(split);
  return { columns, rows, total: Math.max(lines.length - 1, 0) };
}

async function buildResult(id: string, file: File, started: number): Promise<FileResult> {
  const name = file.name.toLowerCase();
  const text = await file.text();
  if (name.endsWith('.csv') || name.endsWith('.tsv')) {
    const { columns, rows, total } = parseCsv(text);
    return {
      fileId: id,
      summary: { rows: total, columns: columns.length, encoding: 'UTF-8', durationMs: Date.now() - started },
      preview: { kind: 'table', columns, rows },
    };
  }
  if (name.endsWith('.json')) {
    try {
      const json = JSON.parse(text);
      return {
        fileId: id,
        summary: { rows: Array.isArray(json) ? json.length : 1, encoding: 'UTF-8', durationMs: Date.now() - started },
        preview: { kind: 'json', json },
      };
    } catch {
      return { fileId: id, summary: { durationMs: Date.now() - started }, preview: { kind: 'text', text: text.slice(0, 20_000) }, warnings: ['JSON no válido: se muestra como texto'] };
    }
  }
  const lines = text.split(/\r?\n/).length;
  return {
    fileId: id,
    summary: { lines, encoding: 'UTF-8', durationMs: Date.now() - started },
    preview: { kind: 'text', text: text.slice(0, 20_000) },
  };
}

async function process(id: string) {
  const entry = store.get(id);
  if (!entry?.file) return;
  const started = Date.now();
  await sleep(700);
  entry.item = { ...entry.item, status: 'Processing', progress: 0 };
  for (let p = 10; p <= 100; p += 15) {
    await sleep(250 + Math.random() * 300);
    entry.item = { ...entry.item, progress: Math.min(p, 100) };
  }
  const ext = entry.file.name.split('.').pop()?.toLowerCase() ?? '';
  const supported = ['csv', 'tsv', 'json', 'txt', 'log', 'xml', 'md'];
  if (!supported.includes(ext)) {
    entry.item = { ...entry.item, status: 'Failed', progress: null, error: `Formato no soportado todavía: .${ext}` };
    return;
  }
  entry.result = await buildResult(id, entry.file, started);
  entry.item = { ...entry.item, status: 'Completed', progress: null, processedAt: new Date().toISOString() };
}

seed();

// El estado de la API no se simula: pingBackend (client.ts) consulta siempre la API real
export const mockApi: Api = {
  async listFiles() {
    await sleep(200);
    return [...store.values()].map((e) => e.item)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  },
  async getFile(id) {
    const e = store.get(id);
    if (!e) throw new Error('No encontrado');
    return e.item;
  },
  async getResult(id) {
    await sleep(250);
    const e = store.get(id);
    if (!e?.result) throw new Error('Resultado no disponible');
    return e.result;
  },
  async deleteFile(id) {
    await sleep(150);
    store.delete(id);
  },
  async reprocess(id) {
    const e = store.get(id);
    if (!e) throw new Error('No encontrado');
    e.item = { ...e.item, status: 'Pending', error: null };
    void process(id);
    return e.item;
  },
  upload(file, onProgress, signal) {
    return new Promise((resolve, reject) => {
      let pct = 0;
      const speed = Math.max(4, 40 - file.size / 200_000);
      const timer = setInterval(() => {
        pct = Math.min(100, pct + speed * (0.6 + Math.random()));
        onProgress(Math.round(pct));
        if (pct >= 100) {
          clearInterval(timer);
          const id = uid();
          const item: FileItem = {
            id, fileName: file.name, contentType: file.type || 'application/octet-stream',
            size: file.size, status: 'Pending', uploadedAt: new Date().toISOString(),
          };
          store.set(id, { item, file });
          void process(id);
          resolve(item);
        }
      }, 120);
      signal?.addEventListener('abort', () => {
        clearInterval(timer);
        reject(new Error('Subida cancelada'));
      });
    });
  },
};
