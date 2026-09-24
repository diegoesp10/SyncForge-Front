/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_MAX_FILE_MB?: string;
}
