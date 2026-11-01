import { createLazyFileRoute } from '@tanstack/react-router'

import { NeighborhoodsPage } from './-components/neighborhoods-page'

export const Route = createLazyFileRoute('/_private/gestao/neighborhoods/')({
  component: NeighborhoodsPage,
})
