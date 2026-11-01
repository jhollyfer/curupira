import { createLazyFileRoute } from '@tanstack/react-router'

import { ReportDetail } from './-components/detail'

export const Route = createLazyFileRoute('/_private/gestao/reports/$id/')({
  component: ReportDetail,
})
