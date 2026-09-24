# Contrato del API que usa el frontal

Contrato verificado contra el backend de SyncForge (`API/Controllers/FilesController.cs` y `Contracts/Files`).

- **Base:** `/api`. En desarrollo, Vite reenvía `/api` a `VITE_BACKEND_URL` (por defecto `http://localhost:5254`).
- **JSON:** camelCase.
- **Idioma:** la API traduce errores y avisos según `?language=es|en` o la cabecera `Accept-Language`. El frontal envía `Accept-Language: es`.
- **Errores:** `ProblemDetails` (`application/problem+json`); el frontal muestra `detail` o, si no hay, `title`.

## Endpoints

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/health` | `200` + `{ "status": "ok", "version": "1.0.0" }` · `503` con el mismo cuerpo si no está sano |
| POST | `/api/files` | `multipart/form-data` con el campo **`file`** → `201` + `FileItem` |
| GET | `/api/files` | `FileItem[]` |
| GET | `/api/files/{id}` | `FileItem` |
| GET | `/api/files/{id}/result` | `FileResult` (solo cuando `status = Completed`; si no, `409`) |
| POST | `/api/files/{id}/reprocess` | `FileItem` |
| DELETE | `/api/files/{id}` | `204` |

Códigos de error: `400` petición no válida · `404` archivo no encontrado · `409` conflicto de estado · `413` archivo demasiado grande.

## Formatos y límites

- **Tamaño máximo:** 50 MB por archivo (`FileService.MaxFileSizeMb`, igual que `VITE_MAX_FILE_MB`).
- **Formatos analizados:** `.csv`, `.tsv` (vista `table`) · `.json` (vista `json`, o `text` si no es válido) · `.txt`, `.log`, `.xml`, `.md` (vista `text`).
- Cualquier otra extensión se acepta en la subida, pero termina en `Failed` con el motivo en `error`.
- La vista previa de tablas se limita a 200 filas.

## Modelos

```ts
FileItem {
  id: string                 // Guid
  fileName: string
  contentType: string
  size: number               // bytes
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  uploadedAt: string         // ISO 8601
  processedAt: string | null
  progress: number | null    // 0-100 mientras procesa
  error: string | null       // motivo traducido si Failed
}

FileResult {
  fileId: string
  summary: { rows?, columns?, lines?, encoding?, durationMs? }
  preview: {
    kind: 'table' | 'text' | 'json'
    columns: string[] | null           // kind = table
    rows: (string | null)[][] | null   // kind = table; las celdas llegan siempre como texto
    text: string | null                // kind = text
    json: unknown | null               // kind = json
  }
  warnings: string[] | null            // traducidos según el idioma
}
```

## Equivalente en C# (`Contracts/Files`)

```csharp
public sealed record FileItemResponse(
    Guid Id, string FileName, string ContentType, long Size, string Status,
    DateTimeOffset UploadedAt, DateTimeOffset? ProcessedAt, int? Progress, string? Error);

public sealed record FilePreviewResponse(
    string Kind, IReadOnlyList<string>? Columns,
    IReadOnlyList<IReadOnlyList<string?>>? Rows, string? Text, JsonElement? Json);

public sealed record FileResultResponse(
    Guid FileId, IReadOnlyDictionary<string, object?> Summary,
    FilePreviewResponse Preview, IReadOnlyList<string>? Warnings);

public sealed record HealthResponse(string Status, string Version);
```

`Status` viaja como texto con los valores del enum `Domain.Files.FileStatus` (`Pending`, `Processing`, `Completed`, `Failed`).

## Endpoints de la API que el frontal no usa

- `/api/import-jobs`: listar, crear, obtener, `start`, `complete`, `fail` y `retry`.
- `/api/orders`: listar (filtro `importJobId`), crear, obtener por id y `by-source`.

Si cambia el contrato de archivos: actualizar a la vez `src/api/types.ts`, `src/api/mock.ts` y este documento.
