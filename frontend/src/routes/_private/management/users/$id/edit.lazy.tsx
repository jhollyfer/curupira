import { createLazyFileRoute } from '@tanstack/react-router'

import { UserFormEdit } from '../-components/form-edit'

export const Route = createLazyFileRoute('/_private/management/users/$id/edit')(
  {
    component: UserFormEdit,
  },
)
