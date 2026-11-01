import { createLazyFileRoute } from '@tanstack/react-router'

import { SchedulePage } from './-components/schedule-page'

export const Route = createLazyFileRoute('/_public/coleta/')({
  component: SchedulePage,
})
