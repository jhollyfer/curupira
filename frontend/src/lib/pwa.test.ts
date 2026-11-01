// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { clearPageCaches } from './pwa'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('clearPageCaches', () => {
  it('deletes the bucket where the worker saves rendered pages', async () => {
    const remove = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('caches', { delete: remove })

    await clearPageCaches()

    expect(remove).toHaveBeenCalledWith('pages')
  })

  it('does nothing where Cache Storage does not exist', async () => {
    vi.stubGlobal('caches', undefined)

    await expect(clearPageCaches()).resolves.toBeUndefined()
  })

  it('never blocks sign-out when the storage refuses', async () => {
    vi.stubGlobal('caches', {
      delete: vi.fn().mockRejectedValue(new Error('denied')),
    })

    await expect(clearPageCaches()).resolves.toBeUndefined()
  })
})
