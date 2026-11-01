import { createFileRoute } from '@tanstack/react-router'

import { storefrontNoticesQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

/** The city hall's notices, all of them. */
export const Route = createFileRoute('/_public/avisos/')({
  loader: async ({ context }) => {
    await context.queryClient.query(storefrontNoticesQueryOptions())
  },
  head: () =>
    pageHead({
      title: m.notices_title(),
      description: m.notices_description(),
      pathname: '/avisos',
    }),
})
