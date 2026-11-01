import { createLazyFileRoute } from '@tanstack/react-router'

import { NoticesPage } from './-components/notices-page'

export const Route = createLazyFileRoute('/_private/gestao/notices/')({
  component: NoticesPage,
})
