import { paraglideVitePlugin } from '@inlang/paraglide-js'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const config = defineConfig(() => {
  // The security headers (CSP, HSTS) live in `src/server.ts`: the policy reads
  // `STORAGE_PUBLIC_URL` per request, and `vite.config.ts` never sees a runtime value.
  //
  // Never stored by a browser, a proxy or the service worker: the panel and the sign-in
  // are rendered for one session. Every locale prefix has its own entry (Nitro route
  // rules match the path as it is served).
  const noStore = { headers: { 'Cache-Control': 'no-store' } }
  const routeRules: Record<string, { headers: Record<string, string> }> = {
    '/gestao/**': noStore,
    '/sign-in': noStore,
    '/en/gestao/**': noStore,
    '/en/sign-in': noStore,
    '/es/gestao/**': noStore,
    '/es/sign-in': noStore,
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
      nitro({ preset: 'node-server', routeRules }),
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
        // Start's client build lands in `.output/public` (Nitro's public dir), not in
        // Vite's default `dist`: pointed there, the precache sees the real assets.
        outDir: '.output/public',
        injectRegister: false,
        manifest: false,
        workbox: {
          // Precache only the light things every page needs (styles, font, icons: about
          // 200 KB). The route chunks (about 1.4 MB with the map) are cached the first
          // time each is used instead: an install that downloads everything is a cost
          // the resident pays up front, on the weakest network, for pages they may
          // never open.
          globPatterns: ['**/*.{css,woff2,svg,png,ico}'],
          // SSR: navigations are answered by the server, never by a precached shell.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Pages already visited keep opening with no signal - the public ones. The panel
              // and the sign-in render per session (the account name, the reports): caching
              // that HTML kept it on the device after sign-out. The regex lives inside the
              // function because workbox serializes it into `sw.js`, where nothing from
              // this file exists; `(en|es)` are the Paraglide URL prefixes.
              urlPattern: ({ request, url }) =>
                request.mode === 'navigate' &&
                !/^(?:\/(?:en|es))?\/(?:gestao|sign-in)(?:\/|$)/.test(
                  url.pathname,
                ),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 30 },
              },
            },
            {
              // Hashed build assets never change under the same name, so the cache
              // answers first and the network is only asked on a miss.
              urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets',
                expiration: { maxEntries: 120 },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              // The schedule, neighborhoods and notices: the app must answer on the
              // bus with no signal. Stale-while-revalidate keeps it fresh when online.
              urlPattern: /\/storefront\/(schedules|neighborhoods|notices)/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'storefront',
                expiration: { maxEntries: 20 },
              },
            },
            {
              urlPattern: /^https:\/\/tile\.openstreetmap\.org\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'map-tiles',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 14,
                },
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
