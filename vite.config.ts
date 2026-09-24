import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy reenvía /api al backend .NET en desarrollo, así no hay que tocar CORS.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:5254',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
