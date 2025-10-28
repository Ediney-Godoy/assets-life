import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    open: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  plugins: [react()]
});