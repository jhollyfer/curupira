import { createFileRoute } from '@tanstack/react-router'

import { managementNoticesQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { validateNoticesSearch } from '#/lib/management-search'

export const Route = createFileRoute('/_private/gestao/notices/')({
  validateSearch: validateNoticesSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    await context.queryClient.query(managementNoticesQueryOptions(deps.search))
  },
})
