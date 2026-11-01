import { createLazyFileRoute } from '@tanstack/react-router'

import { NoticesPage } from './-components/notices-page'

export const Route = createLazyFileRoute('/_public/avisos/')({
  component: NoticesPage,
})
