import { createLazyFileRoute } from '@tanstack/react-router'

import { MapPage } from './-components/map-page'

export const Route = createLazyFileRoute('/_public/mapa/')({
  component: MapPage,
})
