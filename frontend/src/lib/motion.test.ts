// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { prefersReducedMotion } from './motion'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubMatchMedia(matches: boolean): ReturnType<typeof vi.fn> {
  const matchMedia = vi.fn().mockReturnValue({ matches })
  vi.stubGlobal('matchMedia', matchMedia)

  return matchMedia
}

describe('prefersReducedMotion', () => {
  it('asks the system for the reduce preference', () => {
    const matchMedia = stubMatchMedia(true)

    expect(prefersReducedMotion()).toBe(true)
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('is false when the system does not ask for less motion', () => {
    stubMatchMedia(false)

    expect(prefersReducedMotion()).toBe(false)
  })
})
