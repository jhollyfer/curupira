import { createLazyFileRoute } from '@tanstack/react-router'

import { NeighborhoodsPage } from './-components/neighborhoods-page'

export const Route = createLazyFileRoute('/_private/management/neighborhoods/')(
  {
    component: NeighborhoodsPage,
  },
)
