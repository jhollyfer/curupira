import { REPORT_STATUS } from '@curupira/shared'
import { describe, expect, it } from 'vitest'

import {
  STATUS_FLOW,
  canAdvance,
  isFinal,
  isUntreated,
  statusOptions,
} from './report-status'

describe('report status flow', () => {
  it('lists every status of the shared enum, in order, and nothing else', () => {
    expect(STATUS_FLOW).toEqual([
      REPORT_STATUS.RECEIVED,
      REPORT_STATUS.IN_REVIEW,
      REPORT_STATUS.FORWARDED,
      REPORT_STATUS.RESOLVED,
    ])
  })

  it('only moves forward, and may skip steps', () => {
    expect(canAdvance('RECEIVED', 'IN_REVIEW')).toBe(true)
    expect(canAdvance('RECEIVED', 'RESOLVED')).toBe(true)
    expect(canAdvance('FORWARDED', 'IN_REVIEW')).toBe(false)
    expect(canAdvance('IN_REVIEW', 'IN_REVIEW')).toBe(false)
  })

  it('explains why each option is blocked', () => {
    expect(statusOptions('FORWARDED')).toEqual([
      { status: 'RECEIVED', blocked: 'regression' },
      { status: 'IN_REVIEW', blocked: 'regression' },
      { status: 'FORWARDED', blocked: 'current' },
      { status: 'RESOLVED' },
    ])
  })

  it('a resolved report has no option left', () => {
    expect(isFinal('RESOLVED')).toBe(true)
    expect(statusOptions('RESOLVED').every((option) => option.blocked)).toBe(
      true,
    )
  })

  it('only the received ones are untreated', () => {
    expect(isUntreated('RECEIVED')).toBe(true)
    expect(isUntreated('IN_REVIEW')).toBe(false)
  })
})
