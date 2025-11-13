import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    // Allow external access and align with preview server args
    host: true,
    port: 5180,
    strictPort: false,
    open: false,
    // Reduce noisy overlay and align HMR client port
    hmr: {
      protocol: 'ws',
      overlay: false,
    },
  },
  plugins: [react()],
});