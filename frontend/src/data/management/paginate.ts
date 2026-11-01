import { PAGINATION } from '@curupira/shared'
import type { Paginated, SortDirection } from '@curupira/shared'

/**
 * The paginator of the example data: the same envelope the API returns (`meta` + `data`),
 * so the table cannot tell which source answered. Page and per-page are clamped like the
 * backend does (`page >= 1`, `perPage <= 100`) - a mock more forgiving than the API would
 * let a bad URL work in development and fail in production.
 */
type PageQuery = Readonly<{ page?: number; perPage?: number }>

export function paginate<TItem>(
  items: ReadonlyArray<TItem>,
  query: PageQuery,
): Paginated<TItem> {
  const perPage = Math.min(query.perPage ?? PAGINATION.PER_PAGE, 100)
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const currentPage = Math.min(Math.max(query.page ?? PAGINATION.PAGE, 1), lastPage)
  const start = (currentPage - 1) * perPage

  const link = (page: number): string => `/?page=${page}`
  let nextPageUrl: string | null = null
  if (currentPage < lastPage) nextPageUrl = link(currentPage + 1)
  let previousPageUrl: string | null = null
  if (currentPage > 1) previousPageUrl = link(currentPage - 1)

  return {
    meta: {
      total,
      perPage,
      currentPage,
      lastPage,
      firstPage: 1,
      firstPageUrl: link(1),
      lastPageUrl: link(lastPage),
      nextPageUrl,
      previousPageUrl,
    },
    data: items.slice(start, start + perPage),
  }
}

/** Case- and accent-insensitive "contains", like a database `ILIKE unaccent`. */
export function matchesText(
  haystack: ReadonlyArray<string | null>,
  term: string | undefined,
): boolean {
  if (!term) return true

  const fold = (text: string): string =>
    text
      .normalize('NFD')
      .replaceAll(/[̀-ͯ]/g, '')
      .toLowerCase()
  const needle = fold(term.trim())

  return haystack.some((text) => text !== null && fold(text).includes(needle))
}

export function sortedBy<TItem>(
  items: ReadonlyArray<TItem>,
  key: (item: TItem) => string | number,
  direction: SortDirection | undefined,
): Array<TItem> {
  const sign = (direction ?? 'asc') === 'asc' ? 1 : -1

  return [...items].sort((a, b) => {
    const left = key(a)
    const right = key(b)
    if (typeof left === 'number' && typeof right === 'number')
      return (left - right) * sign

    return String(left).localeCompare(String(right)) * sign
  })
}

/**
 * A partial update keeps the stored value when the field is absent. `??` is not the
 * same: `null` is a real value for the optional coordinates ("clear the center"), and
 * `latitude: null` must erase it instead of falling back to the old one.
 */
export function keep<TValue>(next: TValue | undefined, current: TValue): TValue {
  if (next === undefined) return current

  return next
}
