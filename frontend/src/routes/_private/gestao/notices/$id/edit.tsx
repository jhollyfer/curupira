import { createFileRoute } from '@tanstack/react-router'

import { managementNoticeQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { loadOrNotFound } from '#/lib/load-or-not-found'

export const Route = createFileRoute('/_private/gestao/notices/$id/edit')({
  loader: async ({ context, params }) =>
    // `staleTime: 'static'`: the form seeds from this record once. A background refetch
    // would replace `values` under the manager's cursor and wipe what they typed.
    loadOrNotFound(() =>
      context.queryClient.query({
        ...managementNoticeQueryOptions(params.id),
        staleTime: 'static',
      }),
    ),
})
