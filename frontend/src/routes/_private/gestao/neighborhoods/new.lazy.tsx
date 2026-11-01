import { createLazyFileRoute } from '@tanstack/react-router'

import { NeighborhoodFormCreate } from './-components/form-create'

export const Route = createLazyFileRoute('/_private/gestao/neighborhoods/new')({
  component: NeighborhoodFormCreate,
})
