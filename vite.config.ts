import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

type ReleaseMetadata = {
  version?: unknown
}

const releaseMetadata = JSON.parse(
  readFileSync(new URL('./public/version.json', import.meta.url), 'utf8'),
) as ReleaseMetadata

if (typeof releaseMetadata.version !== 'string' || !releaseMetadata.version.trim()) {
  throw new Error('public/version.json debe incluir una versión válida.')
}

const appVersion = releaseMetadata.version.trim()

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'icon.svg',
      ],
      manifest: {
        id: '/',
        name: 'Reclutamiento',
        short_name: 'Reclutamiento',
        description:
          'Control de plantilla, vacantes y pipeline de candidatos.',
        theme_color: '#f6f5f4',
        background_color: '#f6f5f4',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui', 'browser'],
        scope: '/',
        start_url: '/pipeline',
        lang: 'es-MX',
        dir: 'ltr',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        // /horarios administra su propio ciclo PWA y no debe entrar al SW raíz.
        globIgnores: ['horarios/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/horarios(?:\/|$)/,
          /version\.json$/,
        ],
        skipWaiting: false,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Siempre red para /version.json (evita servir versión vieja)
            urlPattern: ({ url }) => url.pathname.endsWith('/version.json'),
            handler: 'NetworkOnly',
            options: { cacheName: 'version-check' },
          },
          {
            // Datos autenticados nunca se persisten en Cache Storage.
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'font' &&
              !url.pathname.startsWith('/horarios/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Solo imágenes públicas locales; JSON funcional permanece en red.
            urlPattern: ({ request, sameOrigin, url }) =>
              sameOrigin &&
              request.destination === 'image' &&
              !url.pathname.startsWith('/horarios/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 2500
  }
})
