import { createFileRoute } from '@tanstack/react-router'

import { managementUsersQueryOptions } from '#/integrations/tanstack-query/queries/management'
import { validateUsersSearch } from '#/lib/management-search'

export const Route = createFileRoute('/_private/gestao/users/')({
  validateSearch: validateUsersSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context, deps }) => {
    await context.queryClient.query(managementUsersQueryOptions(deps.search))
  },
})
