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
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three') || id.includes('vanta')) {
                return 'vendor-three';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react') || id.includes('react-icons')) {
                return 'vendor-icons';
              }
              if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('micromark') || id.includes('unist') || id.includes('hast') || id.includes('mdast')) {
                return 'vendor-markdown';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
    server: {
      // AI Studio sets DISABLE_HMR=true to avoid flicker during agent edits.
      // Local development keeps HMR enabled by default.
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
    },
  };
});
