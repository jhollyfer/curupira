import { createLazyFileRoute } from '@tanstack/react-router'

import { SchedulesPage } from './-components/schedules-page'

export const Route = createLazyFileRoute('/_private/gestao/schedules/')({
  component: SchedulesPage,
})
