import { describe, expect, it } from 'vitest'

import {
  hasReportsFilter,
  reportPeriod,
  reportsFilterOf,
  validateNoticesSearch,
  validateReportsSearch,
  validateSchedulesSearch,
  validateUsersSearch,
} from './management-search'

const ID = '00000000-0000-4000-8000-a00000000001'

describe('validateReportsSearch', () => {
  it('keeps every valid filter and the pagination of the base', () => {
    expect(
      validateReportsSearch({
        kind: 'BURNING',
        status: 'RECEIVED',
        neighborhoodId: ID,
        from: '2026-05-01',
        to: '2026-05-31',
        page: '2',
        sort: 'status',
        direction: 'desc',
      }),
    ).toEqual({
      kind: 'BURNING',
      status: 'RECEIVED',
      neighborhoodId: ID,
      from: '2026-05-01',
      to: '2026-05-31',
      page: 2,
      sort: 'status',
      direction: 'desc',
    })
  })

  it('drops what is not a valid value instead of throwing', () => {
    expect(
      validateReportsSearch({
        kind: 'FLOOD',
        status: 'DONE',
        neighborhoodId: 'not-a-uuid',
        from: '31/05/2026',
      }),
    ).toEqual({})
  })

  it('drops an end before the start, which would match nothing', () => {
    expect(
      validateReportsSearch({ from: '2026-05-10', to: '2026-05-01' }),
    ).toEqual({ from: '2026-05-10' })
  })

  it('drops a sort column the backend does not accept, with its direction', () => {
    expect(
      validateReportsSearch({ sort: 'protocol', direction: 'asc' }),
    ).toEqual({})
  })
})

describe('reportPeriod', () => {
  it('covers the whole first and last day in the town zone (UTC-4)', () => {
    expect(reportPeriod({ from: '2026-05-01', to: '2026-05-02' })).toEqual({
      from: '2026-05-01T00:00:00-04:00',
      to: '2026-05-02T23:59:59-04:00',
    })
  })

  it('is empty without a period', () => {
    expect(reportPeriod({})).toEqual({})
  })
})

describe('reportsFilterOf', () => {
  it('is the cut the map and the table share, without pagination or order', () => {
    const search = validateReportsSearch({
      kind: 'DUMPING',
      page: 3,
      sort: 'kind',
    })

    expect(reportsFilterOf(search)).toEqual({ kind: 'DUMPING' })
    expect(hasReportsFilter(search)).toBe(true)
    expect(hasReportsFilter({ page: 2 })).toBe(false)
  })
})

describe('the other listings', () => {
  it('notices accept a status of the enum only', () => {
    expect(validateNoticesSearch({ status: 'ACTIVE' })).toEqual({
      status: 'ACTIVE',
    })
    expect(validateNoticesSearch({ status: 'OPEN' })).toEqual({})
  })

  it('users accept role and status', () => {
    expect(
      validateUsersSearch({
        role: 'OPERATOR',
        status: 'INACTIVE',
        search: 'ana',
      }),
    ).toEqual({ role: 'OPERATOR', status: 'INACTIVE', search: 'ana' })
    expect(validateUsersSearch({ role: 'ROOT' })).toEqual({})
  })

  it('schedules keep only a uuid neighborhood', () => {
    expect(validateSchedulesSearch({ neighborhoodId: ID })).toEqual({
      neighborhoodId: ID,
    })
    expect(validateSchedulesSearch({ neighborhoodId: '1' })).toEqual({})
  })
})
