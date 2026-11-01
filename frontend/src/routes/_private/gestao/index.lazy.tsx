import { createLazyFileRoute } from '@tanstack/react-router'

import { OverviewPage } from './-components/overview-page'

export const Route = createLazyFileRoute('/_private/gestao/')({
  component: OverviewPage,
})
