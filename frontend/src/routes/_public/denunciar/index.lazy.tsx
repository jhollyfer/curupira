import { createLazyFileRoute } from '@tanstack/react-router'

import { ReportPage } from './-components/report-page'

export const Route = createLazyFileRoute('/_public/denunciar/')({
  component: ReportPage,
})
