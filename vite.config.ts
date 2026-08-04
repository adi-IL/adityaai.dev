import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Keep loadEnv available for future client env wiring; avoid unused binding under strict.
  void loadEnv(mode, rootDir, '');
  return {
    plugins: [react(), tailwindcss()],
    define: {},
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      // AI Studio sets DISABLE_HMR=true to avoid flicker during agent edits.
      // Local development keeps HMR enabled by default.
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
    },
  };
});
