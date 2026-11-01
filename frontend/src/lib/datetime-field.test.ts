import { describe, expect, it } from 'vitest'

import { instantToLocalInput, localInputToInstant } from './datetime-field'

describe('datetime field', () => {
  it('shows an instant as the wall clock of the town', () => {
    expect(instantToLocalInput('2026-05-10T12:30:00Z')).toBe('2026-05-10T08:30')
  })

  it('reads the wall clock of the town back as an instant with its offset', () => {
    expect(localInputToInstant('2026-05-10T08:30')).toBe('2026-05-10T08:30:00-04:00')
  })

  it('round-trips', () => {
    const iso = localInputToInstant('2026-12-31T23:00')

    expect(instantToLocalInput(iso ?? '')).toBe('2026-12-31T23:00')
  })

  it('rejects text that is not a date', () => {
    expect(localInputToInstant('')).toBeUndefined()
    expect(instantToLocalInput('nope')).toBe('')
  })
})
