import { createLazyFileRoute } from '@tanstack/react-router'

import { ReportDetail } from './-components/detail'

export const Route = createLazyFileRoute('/_private/management/reports/$id/')({
  component: ReportDetail,
})
