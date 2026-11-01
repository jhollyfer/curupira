import { describe, expect, it } from 'vitest'

import { countActiveFilters } from './active-filters'

type Search = {
  page?: number
  sort?: string
  status?: string
  search?: string
  from?: string
}

const KEYS = ['status', 'search', 'from'] satisfies ReadonlyArray<keyof Search>

describe('countActiveFilters', () => {
  it('is zero for an empty search', () => {
    expect(countActiveFilters<Search>({}, KEYS)).toBe(0)
  })

  it('counts each filter that has a value', () => {
    expect(
      countActiveFilters<Search>(
        { status: 'RECEIVED', from: '2026-05-01' },
        KEYS,
      ),
    ).toBe(2)
  })

  it('ignores page and sort: they shape the view, they do not narrow it', () => {
    expect(countActiveFilters<Search>({ page: 3, sort: 'status' }, KEYS)).toBe(
      0,
    )
  })

  it('does not count an empty text', () => {
    expect(countActiveFilters<Search>({ search: '' }, KEYS)).toBe(0)
  })
})
