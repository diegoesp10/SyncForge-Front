// Contrato con el backend .NET. Ver API_CONTRACT.md para el detalle de endpoints.

export type FileStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface FileItem {
  id: string;
  fileName: string;
  contentType: string;
  size: number; // bytes
  status: FileStatus;
  uploadedAt: string; // ISO 8601
  processedAt?: string | null;
  progress?: number | null; // 0-100 durante el procesado (opcional)
  error?: string | null;
}

export type PreviewKind = 'table' | 'text' | 'json';

export interface FileResult {
  fileId: string;
  summary: {
    rows?: number;
    columns?: number;
    lines?: number;
    encoding?: string;
    durationMs?: number;
    [key: string]: string | number | undefined;
  };
  preview: {
    kind: PreviewKind;
    columns?: string[];
    rows?: (string | number | null)[][];
    text?: string;
    json?: unknown;
  };
  warnings?: string[];
}

export interface HealthInfo {
  status: 'ok' | 'down';
  version?: string;
}
