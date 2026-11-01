import type { UserRole } from '@curupira/shared'
import { redirect } from '@tanstack/react-router'

import { can } from '#/lib/capabilities'
import type { Capability } from '#/lib/capabilities'

/**
 * The area guard, called from the `beforeLoad` of a restricted area's `layout.tsx`. The
 * session itself is `_private/layout.tsx`'s; this one only decides *which* of the
 * signed-in users may enter, and sends the others to the panel's front door (which every
 * role can open) instead of a 403 page they could not act on.
 *
 * It is the redirect and the menu, not the security: the backend answers 403 to the same
 * routes (`start/routes.ts`), and that is what protects the data.
 */
export function requireCapability(
  role: UserRole,
  capability: Capability,
): void {
  if (can(role, capability)) return

  throw redirect({ to: '/gestao' })
}
