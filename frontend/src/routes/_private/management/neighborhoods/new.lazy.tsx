import { createLazyFileRoute } from '@tanstack/react-router'

import { NeighborhoodFormCreate } from './-components/form-create'

export const Route = createLazyFileRoute(
  '/_private/management/neighborhoods/new',
)({
  component: NeighborhoodFormCreate,
})
