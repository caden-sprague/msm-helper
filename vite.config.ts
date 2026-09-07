import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves from /<repo>/, everything else from the root. Set by CI.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // The default glob omits webp, which would leave every monster icon out
        // of the offline bundle.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MSM Helper',
        short_name: 'MSM',
        description: 'Fast My Singing Monsters breeding lookup',
        theme_color: '#6cbf4b',
        background_color: '#12161b',
        display: 'standalone',
        orientation: 'portrait',
        // Must match `base`, or the installed app opens a 404 and the service
        // worker refuses to control the page.
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
