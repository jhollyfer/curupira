import { paraglideVitePlugin } from '@inlang/paraglide-js'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // The frontend server's security headers (`frontend.md` §3.3):
  // Nitro sends none by default, and without `frame-ancestors` the sign-in
  // screen can be embedded in an `iframe` by another site. `connect-src` and
  // `img-src` open only the API and, with presigned upload, the storage's
  // public origin (`VITE_STORAGE_URL`). `unsafe-inline` in script and style because
  // Start writes the hydration scripts inline and emits no nonce.
  // Production build only: the dev server needs the HMR websocket and eval.
  // _doc-lib/nitro.md#config; https://nitro.build/docs/routing (route rules).
  const origins = ["'self'", env.VITE_API_URL, env.VITE_STORAGE_URL]
    .filter(Boolean)
    .join(' ')
  const tiles = 'https://tile.openstreetmap.org'
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${origins} ${tiles} data: blob:`,
    "font-src 'self' data:",
    `connect-src ${origins}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')

  let securityHeaders = {}
  if (mode === 'production') {
    securityHeaders = {
      '/**': {
        headers: {
          'Content-Security-Policy': csp,
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          // No `preload`: joining the list is a commitment that cannot be undone.
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        },
      },
    }
  }

  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      devtools(),
      // The three languages (_standards/i18n.md §2). The compiler options live in
      // `project.inlang/paraglide.config.ts`, read by this plugin and by the CLI
      // (_doc-lib/paraglide.md#/vite).
      paraglideVitePlugin({ project: './project.inlang' }),
      // The options go straight into the plugin, which is the form the type declares:
      // `nitro(pluginConfig?: NitroPluginConfig)` with `NitroPluginConfig extends
      // NitroConfig` (nitro/dist/vite.d.mts).
      //
      // The old form here, `nitro({ config: { preset } })`, applied the preset
      // all the same - `dist/vite.mjs` builds the config with
      // `defu(pluginConfig, pluginConfig.config, userConfig.nitro)`, so the
      // `config` key is read at runtime. It just is not in the type, and that is what
      // left `tsc` red with TS2353.
      //
      // Pinning the preset still holds: without it Nitro detects the platform from the
      // CI environment variables - Vercel, Netlify, Cloudflare and five more identify
      // themselves - and only falls back to `node-server` when none answers.
      // It is what `Dockerfile-production` expects.
      nitro({ preset: 'node-server', routeRules: securityHeaders }),
      tailwindcss(),
      tanstackStart({
        router: {
          routeToken: 'layout',
        },
      }),
      viteReact(),
      babel({ presets: [reactCompilerPreset()] }),
      // PWA (library not covered by `_doc-lib`; official page:
      // https://vite-pwa-org.netlify.app/guide/). `generateSW` + `injectRegister:
      // false`: Start renders the HTML on the server, so there is no `index.html`
      // for the plugin to inject into; `lib/pwa.ts` registers the worker from the
      // client. `manifest: false` because the manifest is a static pt-BR file in
      // `public/` that the root route links to.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,woff2,svg,png,ico}'],
          // SSR: navigations are answered by the server, never by a precached shell.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Pages already visited keep opening with no signal.
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30 },
              },
            },
            {
              // The schedule, neighborhoods and notices: the app must answer on the
              // bus with no signal. Stale-while-revalidate keeps it fresh when online.
              urlPattern: /\/storefront\/(schedules|neighborhoods|notices)/,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'storefront', expiration: { maxEntries: 20 } },
            },
            {
              urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'map-tiles',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  }
})

export default config
