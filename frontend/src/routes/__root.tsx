import { IconContext } from '@phosphor-icons/react'
import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'

import { ThemeProvider } from '#/components/common/theme-provider'
import { Toaster } from '#/components/ui/sonner'
import { TooltipProvider } from '#/components/ui/tooltip'
import { env } from '#/env'
import { AppDevtools } from '#/integrations/tanstack-query/devtools'
import { noindexMeta, organizationJsonLd } from '#/lib/page-head'
import { registerServiceWorker } from '#/lib/pwa'
import { isIndexable } from '#/lib/site-environment'
import { THEME_CLASS, readTheme } from '#/lib/theme'
import { m } from '#/paraglide/messages'

import { getLocale } from '../paraglide/runtime'
import appCss from '../styles.css?url'

import fontUrl from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url'

/**
 * What every route sees in `context`.
 *
 * `type` and not `interface`: this is not module augmentation - it is a local declaration,
 * and the project rule holds.
 */
type RouterContext = {
  queryClient: QueryClient
}

/** The house's default icon: decorative, text-sized, regular stroke (`frontend.md` §10.2). */
const ICON_DEFAULTS = {
  size: '1em',
  weight: 'regular',
  'aria-hidden': true,
} as const

/** The two `theme-color`s: the browser bar follows the page, light or dark. */
const THEME_COLORS = [
  { media: '(prefers-color-scheme: light)', content: '#f6faf7' },
  { media: '(prefers-color-scheme: dark)', content: '#0f1a14' },
] as const

/**
 * The connection to the API opens together with the HTML (`frontend.md` §9.5); there is
 * none to open while the example data answers.
 */
function apiPreconnect() {
  if (env.VITE_DATA_SOURCE !== 'api') return []

  return [
    {
      rel: 'preconnect',
      href: env.VITE_API_URL,
      crossOrigin: 'use-credentials' as const,
    },
  ]
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // The theme comes from the cookie, read on the server: the first HTML already comes out
  // with the right class (`frontend.md` §6). `isIndexable` is the environment ENV: outside
  // production the whole page answers `noindex` (`frontend.md` §9.7).
  loader: async () => ({
    theme: readTheme(),
    indexable: await isIndexable(),
  }),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: 'utf-8' },
      // `viewport-fit=cover`: the bottom navigation keeps clear of the iPhone home bar
      // through `env(safe-area-inset-bottom)`. Zoom is never disabled.
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: m.common_site_title() },
      { name: 'description', content: m.common_site_description() },
      ...THEME_COLORS.map((color) => ({ name: 'theme-color', ...color })),
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: m.common_brand_name() },
      ...noindexMeta(loaderData?.indexable),
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: organizationJsonLd(),
      },
    ],
    links: [
      ...apiPreconnect(),
      // The only font file the first paint needs (latin subset, variable): preloaded
      // so the text does not wait for the stylesheet to discover it.
      {
        rel: 'preload',
        href: fontUrl,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  const { theme } = Route.useLoaderData()

  // After first paint and on the client only: the worker never competes with hydration.
  React.useEffect(() => {
    void registerServiceWorker()
  }, [])

  return (
    // `suppressHydrationWarning` only here, and it is mandatory for `system`: without a
    // cookie the server does not know the system preference, and the script before
    // hydration writes the class on `<html>` - a node that diverges by nature
    // (`frontend.md` §3.2). With `light` or `dark` the server already sends the class.
    <html
      lang={getLocale()}
      className={THEME_CLASS[theme]}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <IconContext.Provider value={ICON_DEFAULTS}>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
          </IconContext.Provider>
          <Toaster />
        </ThemeProvider>
        <AppDevtools />
        <Scripts />
      </body>
    </html>
  )
}
