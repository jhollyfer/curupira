import { describe, expect, it } from 'vitest'

import {
  formatProtocol,
  normalizeProtocol,
  PROTOCOL_ALPHABET,
  PROTOCOL_PATTERN,
} from './protocol.js'

describe('protocol', () => {
  it('formats eight symbols in the canonical shape', () => {
    expect(formatProtocol('7K3M9Q2X')).toBe('CUR-7K3M-9Q2X')
    expect(PROTOCOL_PATTERN.test('CUR-7K3M-9Q2X')).toBe(true)
  })

  it('forgives case, spaces, missing hyphens and look-alike letters', () => {
    expect(normalizeProtocol('cur 7k3m 9q2x')).toBe('CUR-7K3M-9Q2X')
    expect(normalizeProtocol('7K3M9Q2X')).toBe('CUR-7K3M-9Q2X')
    expect(normalizeProtocol('CUR-OIL1-9Q2X')).toBe('CUR-0111-9Q2X')
  })

  it('returns what does not fit, uppercased, for the validator to refuse', () => {
    expect(normalizeProtocol('abc')).toBe('ABC')
    expect(PROTOCOL_PATTERN.test(normalizeProtocol('abc'))).toBe(false)
  })

  it('keeps the alphabet at 32 symbols without the look-alikes', () => {
    expect(PROTOCOL_ALPHABET).toHaveLength(32)
    expect(PROTOCOL_ALPHABET).not.toMatch(/[ILOU]/)
  })
})
