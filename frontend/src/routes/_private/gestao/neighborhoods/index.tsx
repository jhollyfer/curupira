import { createFileRoute } from '@tanstack/react-router'

import { managementNeighborhoodsQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { validateStorefrontSearch } from '#/lib/list-search'

export const Route = createFileRoute('/_private/gestao/neighborhoods/')({
  validateSearch: validateStorefrontSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    await context.queryClient.query(
      managementNeighborhoodsQueryOptions(deps.search),
    )
  },
})
