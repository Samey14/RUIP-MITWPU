import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function pythonBackendPlugin(): Plugin {
  return {
    name: 'python-backend-runner',
    configureServer() {
      const port = Number(process.env.FASTAPI_PORT) || 8002;
      const client = new net.Socket();
      client.connect(port, '127.0.0.1', () => {
        client.destroy();
        console.log(`[RUIP] FastAPI backend is active on port ${port}`);
      });
      client.on('error', () => {
        client.destroy();
        console.log(`[RUIP] Launching FastAPI backend server on port ${port}...`);
        const proc = spawn('python3', ['-m', 'python_backend.main'], {
          env: { ...process.env, FASTAPI_PORT: String(port) },
          stdio: 'ignore',
          detached: true,
        });
        proc.unref();
      });
    },
  };
}

export default defineConfig(() => {
  const fastApiPort = process.env.FASTAPI_PORT || '8002';
  return {
    plugins: [
      react(),
      tailwindcss(),
      pythonBackendPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['apple-touch-icon.png', 'icon.svg', 'assets/*.svg'],
        manifest: {
          id: '/',
          name: 'RUIP Expense Tracker — MIT-WPU',
          short_name: 'RUIP Tracker',
          description: 'Sleek offline-ready expense tracking, faculty authentication, immersion budget ledger, and analytics for rural immersion programmes.',
          theme_color: '#059669',
          background_color: '#09090b',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api': {
          target: process.env.FASTAPI_BACKEND_URL || `http://127.0.0.1:${fastApiPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});

