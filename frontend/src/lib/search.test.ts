import { describe, expect, it } from 'vitest'

import {
  validateMapSearch,
  validateScheduleSearch,
  validateTrackSearch,
} from './search'

describe('validateMapSearch', () => {
  it('keeps a valid kind and drops anything else', () => {
    expect(validateMapSearch({ kind: 'BURNING' })).toEqual({ kind: 'BURNING' })
    expect(validateMapSearch({ kind: 'nope' })).toEqual({})
    expect(validateMapSearch({})).toEqual({})
  })
})

describe('validateScheduleSearch', () => {
  it('accepts a real month and rejects a made-up one', () => {
    expect(validateScheduleSearch({ month: '2027-01' })).toEqual({
      month: '2027-01',
    })
    expect(validateScheduleSearch({ month: '2027-13' })).toEqual({})
    expect(validateScheduleSearch({ month: 'abc' })).toEqual({})
  })
})

describe('validateTrackSearch', () => {
  it('bounds the protocol and ignores non-text', () => {
    expect(validateTrackSearch({ protocol: 'CUR-1234-5678' })).toEqual({
      protocol: 'CUR-1234-5678',
    })
    expect(validateTrackSearch({ protocol: 12 })).toEqual({})
    expect(
      validateTrackSearch({ protocol: 'x'.repeat(100) }).protocol,
    ).toHaveLength(40)
  })
})
