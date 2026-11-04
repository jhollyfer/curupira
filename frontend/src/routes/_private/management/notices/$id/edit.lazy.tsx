import { createLazyFileRoute } from '@tanstack/react-router'

import { NoticeFormEdit } from '../-components/form-edit'

export const Route = createLazyFileRoute(
  '/_private/management/notices/$id/edit',
)({
  component: NoticeFormEdit,
})
