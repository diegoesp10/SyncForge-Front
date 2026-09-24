# Contrato del API que espera el frontal

Base: `/api`. JSON en camelCase (el serializador por defecto de ASP.NET Core ya lo hace).
Los errores pueden devolverse como `ProblemDetails`; el frontal muestra `detail` o `title`.

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/health` | `{ "status": "ok", "version": "1.0.0" }` |
| POST | `/api/files` | `multipart/form-data` con el campo **`file`** → `201` + `FileItem` |
| GET | `/api/files` | `FileItem[]` (más recientes primero) |
| GET | `/api/files/{id}` | `FileItem` |
| GET | `/api/files/{id}/result` | `FileResult` (solo cuando `status = Completed`) |
| POST | `/api/files/{id}/reprocess` | `FileItem` con `status = Pending` |
| DELETE | `/api/files/{id}` | `204` |

## Modelos

```ts
FileItem {
  id: string            // Guid
  fileName: string
  contentType: string
  size: number          // bytes
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  uploadedAt: string    // ISO 8601
  processedAt?: string | null
  progress?: number | null   // 0-100 mientras procesa (opcional)
  error?: string | null      // mensaje si Failed
}

FileResult {
  fileId: string
  summary: { rows?, columns?, lines?, encoding?, durationMs?, ...claves libres }
  preview: {
    kind: 'table' | 'text' | 'json'
    columns?: string[]          // kind = table
    rows?: (string|number|null)[][]  // kind = table (limitar a ~200 filas)
    text?: string               // kind = text
    json?: any                  // kind = json
  }
  warnings?: string[]
}
```

## Equivalente en C#

```csharp
public enum FileStatus { Pending, Processing, Completed, Failed }

public record FileItemDto(
    Guid Id, string FileName, string ContentType, long Size,
    FileStatus Status, DateTimeOffset UploadedAt,
    DateTimeOffset? ProcessedAt, int? Progress, string? Error);

public record FilePreviewDto(
    string Kind, IReadOnlyList<string>? Columns,
    IReadOnlyList<IReadOnlyList<object?>>? Rows, string? Text, object? Json);

public record FileResultDto(
    Guid FileId, IDictionary<string, object> Summary,
    FilePreviewDto Preview, IReadOnlyList<string>? Warnings);
```

Para que el enum viaje como texto (`"Completed"`) y no como número:

```csharp
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
```

Ejemplo mínimo del endpoint de subida (Minimal API):

```csharp
app.MapPost("/api/files", async (IFormFile file, IFileService svc, CancellationToken ct) =>
{
    var item = await svc.EnqueueAsync(file, ct);   // guarda y encola para procesar en segundo plano
    return Results.Created($"/api/files/{item.Id}", item);
}).DisableAntiforgery();
```

Si el límite de 50 MB se queda corto, sube también `FormOptions.MultipartBodyLengthLimit` y `KestrelServerOptions.Limits.MaxRequestBodySize` en el backend, y `VITE_MAX_FILE_MB` en el frontal.
