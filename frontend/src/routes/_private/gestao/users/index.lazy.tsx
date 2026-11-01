import { createLazyFileRoute } from '@tanstack/react-router'

import { UsersPage } from './-components/users-page'

export const Route = createLazyFileRoute('/_private/gestao/users/')({
  component: UsersPage,
})
