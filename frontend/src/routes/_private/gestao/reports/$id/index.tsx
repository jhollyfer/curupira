import { createFileRoute } from '@tanstack/react-router'

import { managementReportQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { loadOrNotFound } from '#/lib/load-or-not-found'

/**
 * One occurrence. An id the API does not know is a business 404: `notFound()` from the
 * loader, answered by the panel's own `notFoundComponent` (on `_private/layout.tsx`),
 * which keeps the sidebar - the queue is one click away.
 */
export const Route = createFileRoute('/_private/gestao/reports/$id/')({
  loader: async ({ context, params }) => {
    await loadOrNotFound(() =>
      context.queryClient.query(managementReportQueryOptions(params.id)),
    )
  },
})
