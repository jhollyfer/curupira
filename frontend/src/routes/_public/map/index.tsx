import { createFileRoute } from '@tanstack/react-router'

import { storefrontReportsMapQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { pageHead } from '#/lib/page-head'
import { validateMapSearch } from '#/lib/search'
import { m } from '#/paraglide/messages'

/**
 * The public map: resolved and in-progress occurrences by kind, with nothing about who
 * reported. The kind filter is in the URL (`?kind=BURNING`), so a link to "only fires"
 * can be shared. The data loads on the server too: the list under the map is the
 * text version of the pins, and it must exist before JavaScript does.
 */
export const Route = createFileRoute('/_public/map/')({
  validateSearch: validateMapSearch,
  loader: async ({ context }) => {
    await context.queryClient.query(storefrontReportsMapQueryOptions())
  },
  head: () => {
    const head = pageHead({
      title: m.map_title(),
      description: m.map_description(),
      pathname: '/map',
    })

    return {
      ...head,
      // The tiles come from another origin: open the connection with the HTML.
      links: [
        ...head.links,
        { rel: 'preconnect', href: 'https://tile.openstreetmap.org' },
      ],
    }
  },
})
