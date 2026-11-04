import { createFileRoute } from '@tanstack/react-router'

import { storefrontReportByProtocolQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { loadOrNotFound } from '#/lib/load-or-not-found'
import { pageHead } from '#/lib/page-head'
import { validateTrackSearch } from '#/lib/search'
import { m } from '#/paraglide/messages'

import { TrackNotFound } from './-components/track-not-found'

/**
 * Follow a report by its protocol. The code is in the URL (`?protocol=CUR-…`), so the
 * link from "Acompanhar" at the end of the report opens the result, and F5 keeps it.
 *
 * An unknown protocol is a business 404: `notFound()` in the loader, answered by this
 * route's own `notFoundComponent` (it keeps the form so the resident can fix the code
 * - the global 404 would send them to the home).
 */
export const Route = createFileRoute('/_public/track/')({
  validateSearch: validateTrackSearch,
  loaderDeps: ({ search }) => ({ protocol: search.protocol }),
  loader: async ({ context, deps }) => {
    if (!deps.protocol) return

    await loadOrNotFound(() =>
      context.queryClient.query(
        storefrontReportByProtocolQueryOptions(deps.protocol ?? ''),
      ),
    )
  },
  head: () =>
    pageHead({
      title: m.track_title(),
      description: m.track_description(),
      pathname: '/track',
    }),
  notFoundComponent: TrackNotFound,
})
