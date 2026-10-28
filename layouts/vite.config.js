import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// VITE_BASE: where the app is served, e.g. /gip-platform/layouts/ on GitHub Pages (default /).
export default defineConfig(({ mode }) => {
  const base = (loadEnv(mode, process.cwd(), '').VITE_BASE || '/').replace(/\/?$/, '/');
  return {
    base,
    plugins: [react()],
    server: { port: 4030, host: '127.0.0.1', strictPort: true },
    build: { outDir: 'dist', chunkSizeWarningLimit: 900 },
  };
});
