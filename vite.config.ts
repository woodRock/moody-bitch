/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

// Set VITE_BASE_PATH="/" when self-hosting at a domain root. GitHub Pages
// project sites live under /<repo>/.
const base = process.env.VITE_BASE_PATH ?? '/moody-bitch/';

/**
 * Production Content Security Policy. GitHub Pages cannot send headers, so it
 * ships as a <meta> tag. Dev is excluded because Vite injects inline scripts.
 * The hash covers the SPA-redirect inline script in index.html.
 */
function csp(): Plugin {
  return {
    name: 'skyrim-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
      const hashes = inline.map(src => `'sha256-${createHash('sha256').update(src).digest('base64')}'`);
      const proxy = process.env.VITE_LORE_PROXY_URL ? new URL(process.env.VITE_LORE_PROXY_URL).origin : '';
      const policy = [
        "default-src 'self'",
        `script-src 'self' ${hashes.join(' ')}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
        `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.google.com ${proxy}`.trim(),
        "frame-src https://*.firebaseapp.com https://accounts.google.com",
        "media-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ].join('; ');
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`);
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  plugins: [react(), csp()],
  base: command === 'build' || isPreview ? base : '/',
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Stable vendor chunks cache well across deploys.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Keep every Firebase package together: they import each other and splitting
          // them produces circular chunks that throw "cannot access before initialization".
          if (id.includes('@firebase') || id.includes('/firebase/') || id.includes('re2js') || id.includes('/idb/')) return 'firebase';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('framer-motion') || id.includes('motion-')) return 'motion';
          if (id.includes('react-pageflip') || id.includes('page-flip')) return 'pageflip';
          if (id.includes('react-router') || id.includes('/react/') || id.includes('react-dom') || id.includes('scheduler')) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] },
  },
}));
