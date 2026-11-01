import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireCapability } from '../../-components/require-capability'

/**
 * The neighborhoods area: administrator only. The guard is here, in the area's own
 * `layout.tsx`, so every route added under `neighborhoods/` is born protected by being in
 * the right folder. The backend answers 403 to the same routes; this is the redirect.
 */
export const Route = createFileRoute('/_private/gestao/neighborhoods')({
  beforeLoad: ({ context }) =>
    requireCapability(context.account.role, 'neighborhoods'),
  component: Outlet,
})
