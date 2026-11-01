import { createLazyFileRoute } from '@tanstack/react-router'

import { ReportsPage } from './-components/reports-page'

export const Route = createLazyFileRoute('/_private/gestao/reports/')({
  component: ReportsPage,
})
