import { createLazyFileRoute } from '@tanstack/react-router'

import { UserFormCreate } from './-components/form-create'

export const Route = createLazyFileRoute('/_private/management/users/new')({
  component: UserFormCreate,
})
