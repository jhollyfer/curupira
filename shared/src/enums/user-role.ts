/**
 * The user role. A lookup object instead of a loose union: the key names the role in
 * code, the value is what goes to the database and the API, and the type is derived
 * from it - no repeated literal to drift apart.
 *
 * Two roles, one per responsibility in the municipal management:
 *
 * - `ADMINISTRATOR`: the management lead. Everything the panel does, plus the
 *   collection schedule, the neighborhoods and the accounts.
 * - `OPERATOR`: the field and desk team. Handles the reports (status and reply) and
 *   the notices, and nothing else.
 *
 * No `OWNER`: purge stays with the administrator.
 */
export const USER_ROLE = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  OPERATOR: 'OPERATOR',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const USER_ROLES = Object.values(USER_ROLE)
