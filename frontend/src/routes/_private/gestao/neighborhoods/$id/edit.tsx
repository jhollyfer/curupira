import { createFileRoute } from '@tanstack/react-router'

import { managementNeighborhoodQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { loadOrNotFound } from '#/lib/load-or-not-found'

export const Route = createFileRoute('/_private/gestao/neighborhoods/$id/edit')({
  loader: async ({ context, params }) =>
    loadOrNotFound(() =>
      context.queryClient.query({
        ...managementNeighborhoodQueryOptions(params.id),
        staleTime: 'static',
      }),
    ),
})
