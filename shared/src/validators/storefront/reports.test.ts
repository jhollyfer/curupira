import { describe, expect, it } from 'vitest'

import {
  StorefrontReportCreateValidator,
  StorefrontReportShowByProtocolValidator,
} from './reports.validator.js'

const PHOTO = '0b3c7a52-6f1d-4d6e-9a2a-1d9e5c0f7b11'

const valid = {
  kind: 'BURNING',
  latitude: -4.3836,
  longitude: -70.0311,
  photoIds: [PHOTO],
}

describe('StorefrontReportCreateValidator', () => {
  it('accepts an anonymous report: no contact, no description', () => {
    expect(StorefrontReportCreateValidator.safeParse(valid).success).toBe(true)
  })

  it('requires at least one photo and caps them at three', () => {
    expect(
      StorefrontReportCreateValidator.safeParse({ ...valid, photoIds: [] })
        .success,
    ).toBe(false)
    expect(
      StorefrontReportCreateValidator.safeParse({
        ...valid,
        photoIds: [PHOTO, PHOTO, PHOTO, PHOTO],
      }).success,
    ).toBe(false)
  })

  it('refuses a coordinate outside the globe', () => {
    expect(
      StorefrontReportCreateValidator.safeParse({ ...valid, latitude: 91 })
        .success,
    ).toBe(false)
  })
})

describe('StorefrontReportShowByProtocolValidator', () => {
  it('normalizes what was typed on a phone', () => {
    const parsed = StorefrontReportShowByProtocolValidator.safeParse({
      protocol: ' cur 7k3m 9q2x ',
    })
    expect(parsed.success).toBe(true)
    expect(parsed.data?.protocol).toBe('CUR-7K3M-9Q2X')
  })

  it('refuses a code that cannot exist', () => {
    expect(
      StorefrontReportShowByProtocolValidator.safeParse({ protocol: 'abc' })
        .success,
    ).toBe(false)
  })
})
