import { createFileRoute } from '@tanstack/react-router'

import {
  managementNeighborhoodOptionsQueryOptions,
  managementReportsMapQueryOptions,
  managementReportsQueryOptions,
} from '#/integrations/tanstack-query/queries/management'
import { reportsFilterOf, validateReportsSearch } from '#/lib/management-search'

/**
 * The occurrences: map and table share one cut of the data, and that cut lives in the URL
 * (`reportsFilterOf` is the single place that decides which params are the *filter* and
 * which are page/order). Both queries and the neighborhood options start in parallel.
 */
export const Route = createFileRoute('/_private/gestao/reports/')({
  validateSearch: validateReportsSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.query(managementReportsQueryOptions(deps.search)),
      context.queryClient.query(
        managementReportsMapQueryOptions(reportsFilterOf(deps.search)),
      ),
      context.queryClient.query(managementNeighborhoodOptionsQueryOptions()),
    ])
  },
})
