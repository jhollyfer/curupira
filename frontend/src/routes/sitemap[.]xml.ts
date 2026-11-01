import { createFileRoute } from '@tanstack/react-router'

import { SITEMAP_STATIC_ENTRIES, sitemapXml } from '#/lib/sitemap'

/**
 * `sitemap.xml` is a server route, and not a `public/` file: the absolute URL depends
 * on the environment (`frontend.md` §9.7). Every public page is static (the data
 * pages are the same URL for everyone), so there is nothing to fetch; the pure logic
 * lives in `lib/sitemap.ts`.
 * _doc-lib/tanstack-start.md#guide/server-routes.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () =>
        new Response(sitemapXml(SITEMAP_STATIC_ENTRIES), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        }),
    },
  },
})
