# SyncForge · Frontal

Aplicación web para **subir archivos** y seguir cómo los procesa el backend de SyncForge (API .NET). El frontal sube, lista, consulta el estado y muestra el resultado; toda la lectura y el procesado de los archivos los hace el backend.

**Stack:** React 19 · TypeScript · Vite 8 · pnpm

## Índice

- [Funcionalidades](#funcionalidades)
- [Requisitos](#requisitos)
- [Puesta en marcha en local](#puesta-en-marcha-en-local)
- [Configuración](#configuración)
- [Scripts](#scripts)
- [Conectar con el backend .NET](#conectar-con-el-backend-net)
- [Gestión de dependencias](#gestión-de-dependencias)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Solución de problemas](#solución-de-problemas)

## Funcionalidades

- Subida por arrastrar y soltar o con selector, varios archivos a la vez (3 en paralelo), con progreso real y cancelación.
- Validación antes de subir: solo formatos admitidos, sin archivos vacíos ni por encima del límite, nombres sin caracteres peligrosos y detección de binarios renombrados (PDF, ZIP/XLSX, ejecutables, imágenes). Los rechazos y los errores de la API se muestran con su motivo y su origen.
- Panel con métricas y listado con búsqueda y filtros por estado.
- Panel lateral de detalle: estado, resumen y vista previa del resultado (tabla, JSON o texto).
- Actualización automática: cada 1 s mientras hay archivos en cola o procesándose, cada 8 s si no.
- **Papelera:** los archivos se mueven a la papelera (con opción de deshacer) y desde ahí se restauran o se eliminan definitivamente. Cada uno muestra cuánto le queda: la API los elimina sola 30 días después de moverlos.
- Estado de la API a la vista: indicador en la cabecera (con latencia), aviso si deja de responder y panel en **Conexión** con el historial de comprobaciones. Se comprueba cada 15 s y al pulsar el indicador.
- Interfaz en **español e inglés**, con selector ES / EN en la cabecera. Los textos están en `src/i18n/locales/es.json` y `en.json`, y el idioma elegido se envía a la API (`Accept-Language`) para que sus mensajes lleguen en el mismo idioma.
- Indicadores de carga en cada acción que espera a la API (actualizar, reprocesar, eliminar, descargar, subir).
- Modo día (por defecto) y modo noche a elección del usuario. Diseño fluido: ocupa toda la pantalla en monitores anchos; en tablet la barra lateral se compacta y en móvil pasa a una barra inferior con la tabla en tarjetas.

## Requisitos

| Herramienta | Versión | Comprobar |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.19+ o 22.12+ (requisito de Vite 8) | `node -v` |
| [pnpm](https://pnpm.io/) | 10.33.0 (fijada en `package.json` → `packageManager`) | `pnpm -v` |

Si no tienes pnpm, actívalo con **corepack**, que viene incluido en Node y usa automáticamente la versión fijada en el proyecto:

```bash
corepack enable
```

Si corepack no funciona (en Windows puede necesitar una terminal como administrador), instálalo con npm:

```bash
npm install -g pnpm@10.33.0
```

## Puesta en marcha en local

**1. Clonar el repositorio y entrar en la carpeta**

```bash
git clone <url-del-repositorio>
cd "SyncForge Front"
```

**2. Crear el archivo de entorno** a partir de la plantilla (el `.env` no se sube al repositorio):

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

```bash
# macOS, Linux o Git Bash
cp .env.example .env
```

**3. Instalar las dependencias**

```bash
pnpm install
```

**4. Arrancar el servidor de desarrollo**

```bash
pnpm dev
```

**5. Abrir la aplicación** en http://localhost:5173

Todos los datos vienen de la API .NET, así que tiene que estar levantada (ver [Conectar con el backend .NET](#conectar-con-el-backend-net)); si no responde, la aplicación lo indica en la cabecera. Los cambios en `src/` se aplican al instante. Para detener el servidor, pulsa `Ctrl + C` en la terminal.

### Desde Visual Studio Code

1. **Archivo → Abrir carpeta** y selecciona la carpeta del proyecto.
2. Abre la terminal integrada con `` Ctrl + ` ``.
3. Ejecuta los pasos 2 a 4 anteriores.
4. Haz `Ctrl + clic` sobre la URL que muestra la terminal.

VS Code ofrecerá instalar las extensiones recomendadas del proyecto (ESLint y Prettier), definidas en `.vscode/extensions.json`.

## Configuración

Variables del archivo `.env`:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_BACKEND_URL` | URL del backend .NET a la que Vite reenvía las peticiones a `/api` en desarrollo | `http://localhost:5254` |
| `VITE_MAX_FILE_MB` | Tamaño máximo por archivo que admite el frontal, en MB | `50` |

Vite lee el `.env` al arrancar: después de modificarlo, detén el servidor y vuelve a ejecutar `pnpm dev`.

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo en http://localhost:5173 con proxy de `/api` al backend |
| `pnpm build` | Comprueba los tipos y genera la versión de producción en `dist/` |
| `pnpm preview` | Sirve el contenido de `dist/` para probar el build (requiere `pnpm build` antes) |
| `pnpm typecheck` | Solo comprueba los tipos de TypeScript |

Antes de subir cambios, `pnpm build` debe terminar sin errores.

## Conectar con el backend .NET

1. Arranca la API .NET.
2. `VITE_BACKEND_URL` ya apunta al perfil `http` de la API (`http://localhost:5254`). Cámbialo en el `.env` solo si la levantas en otra URL (por ejemplo `https://localhost:7233` con el perfil `https`) y reinicia `pnpm dev`.

En desarrollo, Vite actúa de **proxy**: todas las peticiones a `/api/*` se reenvían a `VITE_BACKEND_URL`. Así no hace falta configurar CORS en el backend, y se acepta el certificado HTTPS de desarrollo de .NET.

Los endpoints y DTOs que espera el frontal están documentados en [API_CONTRACT.md](API_CONTRACT.md).

## Gestión de dependencias

El proyecto usa **pnpm** como único gestor de paquetes. No uses npm ni yarn, para que el único lockfile sea `pnpm-lock.yaml`.

```bash
pnpm add <paquete>        # dependencia de la aplicación
pnpm add -D <paquete>     # dependencia de desarrollo
pnpm remove <paquete>
```

Sube siempre `package.json` y `pnpm-lock.yaml` juntos.

Instala las dependencias en la misma plataforma donde vas a ejecutar el proyecto: no copies `node_modules` entre Windows, WSL o Docker.

## Estructura del proyecto

```
src/
  api/          types.ts (DTOs) · client.ts (fetch/XHR y comprobación de salud)
  i18n/         index.tsx (I18nProvider, useI18n, t) · locales/es.json · locales/en.json
  hooks/        useFiles (listado + sondeo) · useUploads (cola de subida) · useTrash (papelera) · useBackendStatus (salud de la API) · useTheme
  components/   Sidebar, Header, StatCards, Dropzone, UploadQueue, FileList, FileDetail, FilePreview, TrashView, BackendStatus, Loader, AsyncButton, ConfirmButton…
  styles/       index.css (tokens de diseño + responsive)
  utils/        format.ts (tamaños, fechas relativas, tipo de archivo)
```

## Solución de problemas

**El puerto 5173 está ocupado.**
Vite arranca en el siguiente puerto libre (5174, 5175…) y lo indica en la terminal. Para recuperar el 5173, cierra el otro `pnpm dev` que tengas abierto.

**Error `EPERM` o `EBUSY` al instalar en Windows.**
Algún proceso tiene abiertos archivos de `node_modules`. Detén `pnpm dev`, cierra otras terminales del proyecto y vuelve a instalar.

**Las dependencias han quedado en mal estado.** Haz una instalación limpia:

```powershell
Remove-Item -Recurse -Force node_modules
pnpm install
```

**Aviso `NODE_TLS_REJECT_UNAUTHORIZED` al ejecutar pnpm.**
Esa variable de entorno está definida en tu sistema y desactiva la verificación de certificados TLS en todo lo que ejecuta Node. El proyecto no la necesita: si no la configuraste a propósito (por ejemplo, por un proxy corporativo), elimínala de las variables de entorno.

**La aplicación no conecta con el backend.**
Comprueba que la API está arrancada y que `VITE_BACKEND_URL` coincide con su URL. El estado aparece en la cabecera y con más detalle en la vista **Conexión**. Recuerda reiniciar `pnpm dev` tras cambiar el `.env`.
