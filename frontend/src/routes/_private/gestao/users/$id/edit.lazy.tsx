import { createLazyFileRoute } from '@tanstack/react-router'

import { UserFormEdit } from '../-components/form-edit'

export const Route = createLazyFileRoute('/_private/gestao/users/$id/edit')({
  component: UserFormEdit,
})
