/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Tests run in a fixed zone with DST so midnight and DST edges are deterministic.
if (process.env.VITEST) process.env.TZ = 'America/New_York';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'TaskDone',
        short_name: 'TaskDone',
        description: 'Your daily tasks, done.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Matches --color-bg (paper-50); manifest values cannot read CSS variables.
        background_color: '#fffbef',
        theme_color: '#fffbef',
        categories: ['productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  build: {
    // The Firestore SDK alone is ~580 kB (150 kB gzip); it is isolated and lazy-loaded.
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        // Firebase changes rarely: separate chunks stay cached across app deploys.
        manualChunks(id) {
          if (
            id.includes('node_modules/@firebase/firestore') ||
            id.includes('node_modules/firebase/firestore')
          )
            return 'firebase-firestore';
          if (
            id.includes('node_modules/@firebase/auth') ||
            id.includes('node_modules/firebase/auth')
          )
            return 'firebase-auth';
          if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase'))
            return 'firebase-core';
          if (id.includes('node_modules/react')) return 'react';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
