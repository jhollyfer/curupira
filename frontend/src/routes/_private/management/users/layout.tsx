import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireCapability } from '../../-components/require-capability'

/**
 * The accounts area: administrator only (the backend answers 403 to the same routes). The
 * guard sits in the area's `layout.tsx` so every route added under `users/` is born
 * protected; the operator is sent back to the panel's front door.
 */
export const Route = createFileRoute('/_private/management/users')({
  beforeLoad: ({ context }) => requireCapability(context.account.role, 'users'),
  component: Outlet,
})
