import { createLazyFileRoute } from '@tanstack/react-router'

import { ProfileForm } from './-components/profile-form'

export const Route = createLazyFileRoute('/_private/gestao/account/profile/')({
  component: ProfileForm,
})
