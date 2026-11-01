import { createFileRoute } from '@tanstack/react-router'

import { storefrontNeighborhoodsQueryOptions, storefrontNoticesQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { townNowIso } from '#/lib/i18n'
import { pageHead } from '#/lib/page-head'

/**
 * The home: the answer to "when does the truck pass?" plus the way to report.
 *
 * The loader brings what is the same for everyone (neighborhoods, notices) and "now" as
 * text. The schedule itself depends on the neighborhood this device chose, which only
 * the browser knows (`localStorage`), so it loads on the client right after mount.
 */
export const Route = createFileRoute('/_public/')({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.query(storefrontNeighborhoodsQueryOptions()),
      context.queryClient.query(storefrontNoticesQueryOptions()),
    ])

    return { now: townNowIso() }
  },
  head: () => pageHead({ pathname: '/' }),
})
