import { createFileRoute } from '@tanstack/react-router'

import { managementUserQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { loadOrNotFound } from '#/lib/load-or-not-found'

export const Route = createFileRoute('/_private/management/users/$id/edit')({
  loader: async ({ context, params }) =>
    loadOrNotFound(() =>
      context.queryClient.query({
        ...managementUserQueryOptions(params.id),
        staleTime: 'static',
      }),
    ),
})
