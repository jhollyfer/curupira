import { createLazyFileRoute } from '@tanstack/react-router'

import { TrackPage } from './-components/track-page'

export const Route = createLazyFileRoute('/_public/track/')({
  component: TrackPage,
})
