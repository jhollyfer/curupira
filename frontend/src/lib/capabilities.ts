import type { UserRole } from '@curupira/shared'

/**
 * What each role may open in the panel. One table, read by the area guards (the
 * `layout.tsx` of each restricted area) and by the sidebar, so a screen the guard
 * refuses is never offered as a link.
 *
 * It mirrors the backend's route groups (`start/routes.ts`): operator and administrator
 * share reports and notices, and only the administrator touches the schedule, the
 * neighborhoods and the accounts. The server stays the authority - the client check is
 * for the redirect and the menu, and protects nothing by itself.
 */
export type Capability =
  | 'overview'
  | 'reports'
  | 'notices'
  | 'schedules'
  | 'neighborhoods'
  | 'users'
  | 'profile'

const ALL: ReadonlyArray<UserRole> = ['ADMINISTRATOR', 'OPERATOR']
const ADMINISTRATOR_ONLY: ReadonlyArray<UserRole> = ['ADMINISTRATOR']

export const CAPABILITY_ROLES = {
  overview: ALL,
  reports: ALL,
  notices: ALL,
  profile: ALL,
  schedules: ADMINISTRATOR_ONLY,
  neighborhoods: ADMINISTRATOR_ONLY,
  users: ADMINISTRATOR_ONLY,
} satisfies Record<Capability, ReadonlyArray<UserRole>>

export function can(role: UserRole, capability: Capability): boolean {
  return CAPABILITY_ROLES[capability].includes(role)
}
