import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function getPackageVersion() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const pkgPath = path.join(__dirname, 'package.json');
    const raw = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    return String(pkg.version || '0.0.0');
  } catch {
    return '0.0.0';
  }
}

function getGitSha() {
  const fromVercel = process.env.VERCEL_GIT_COMMIT_SHA;
  if (fromVercel) return String(fromVercel).slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

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
  define: {
    __APP_VERSION__: JSON.stringify(getPackageVersion()),
    __GIT_SHA__: JSON.stringify(getGitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
