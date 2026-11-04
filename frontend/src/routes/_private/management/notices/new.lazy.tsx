import { createLazyFileRoute } from '@tanstack/react-router'

import { NoticeFormCreate } from './-components/form-create'

export const Route = createLazyFileRoute('/_private/management/notices/new')({
  component: NoticeFormCreate,
})
