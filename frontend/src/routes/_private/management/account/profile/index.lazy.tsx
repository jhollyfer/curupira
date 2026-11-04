import { createLazyFileRoute } from '@tanstack/react-router'

import { ProfileForm } from './-components/profile-form'

export const Route = createLazyFileRoute(
  '/_private/management/account/profile/',
)({
  component: ProfileForm,
})
