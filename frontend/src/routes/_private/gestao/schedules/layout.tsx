import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireCapability } from '../../-components/require-capability'

/**
 * The collection schedule area: administrator only. Guard in the area's `layout.tsx`, as
 * in `users/` and `neighborhoods/`; the backend answers 403 to the same routes.
 */
export const Route = createFileRoute('/_private/gestao/schedules')({
  beforeLoad: ({ context }) =>
    requireCapability(context.account.role, 'schedules'),
  component: Outlet,
})
