import { createLazyFileRoute } from '@tanstack/react-router'

import { UserFormCreate } from './-components/form-create'

export const Route = createLazyFileRoute('/_private/gestao/users/new')({
  component: UserFormCreate,
})
