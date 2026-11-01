import { describe, expect, it } from 'vitest'

import { CAPABILITY_ROLES, can } from './capabilities'

describe('capabilities', () => {
  it('the operator sees the overview, reports and notices only', () => {
    const allowed = Object.entries(CAPABILITY_ROLES)
      .filter(([, roles]) => roles.includes('OPERATOR'))
      .map(([capability]) => capability)

    expect(allowed.sort()).toEqual(['notices', 'overview', 'profile', 'reports'])
  })

  it('the administrator sees everything', () => {
    for (const roles of Object.values(CAPABILITY_ROLES)) {
      expect(roles).toContain('ADMINISTRATOR')
    }
  })

  it('schedules, neighborhoods and accounts are administrator only', () => {
    expect(can('OPERATOR', 'schedules')).toBe(false)
    expect(can('OPERATOR', 'neighborhoods')).toBe(false)
    expect(can('OPERATOR', 'users')).toBe(false)
  })
})
