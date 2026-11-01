import { createFileRoute } from '@tanstack/react-router'

import {
  managementNeighborhoodOptionsQueryOptions,
  managementSchedulesQueryOptions,
} from '#/integrations/tanstack-query/queries/management'
import { validateSchedulesSearch } from '#/lib/management-search'

export const Route = createFileRoute('/_private/gestao/schedules/')({
  validateSearch: validateSchedulesSearch,
  loaderDeps: ({ search }) => ({ neighborhoodId: search.neighborhoodId }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.query(managementNeighborhoodOptionsQueryOptions()),
      // Disabled without a neighborhood (`enabled`), so this is a no-op until one is chosen.
      context.queryClient.query(
        managementSchedulesQueryOptions(deps.neighborhoodId),
      ),
    ])
  },
})
