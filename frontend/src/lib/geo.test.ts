import { describe, expect, it } from 'vitest'

import { TOWN_CENTER, clampToTown, isInsideTown } from './geo'

describe('town bounds', () => {
  it('contains the center', () => {
    expect(isInsideTown(TOWN_CENTER)).toBe(true)
  })

  it('rejects a pin on another continent', () => {
    expect(isInsideTown({ latitude: 48.85, longitude: 2.35 })).toBe(false)
  })

  it('pulls a far pin back to the nearest edge', () => {
    const pulled = clampToTown({ latitude: 10, longitude: -80 })

    expect(isInsideTown(pulled)).toBe(true)
    expect(pulled.latitude).toBeLessThan(0)
  })

  it('leaves a pin inside the box untouched', () => {
    expect(clampToTown(TOWN_CENTER)).toEqual(TOWN_CENTER)
  })
})
