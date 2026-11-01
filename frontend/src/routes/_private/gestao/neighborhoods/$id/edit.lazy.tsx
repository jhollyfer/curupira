import { createLazyFileRoute } from '@tanstack/react-router'

import { NeighborhoodFormEdit } from '../-components/form-edit'

export const Route = createLazyFileRoute(
  '/_private/gestao/neighborhoods/$id/edit',
)({
  component: NeighborhoodFormEdit,
})
