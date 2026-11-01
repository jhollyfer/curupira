/**
 * How many of a listing's filters are in force, for the "Filtros (3)" button of the
 * phone layout, where the controls are folded away and the count is the only sign that
 * the list is a cut and not the whole set.
 *
 * Takes the keys that *are* filters, never every key of the search: `page`, `perPage`,
 * `sort` and `direction` shape the view, they do not narrow it, and counting them would
 * show "Filtros (1)" on page 2 of an unfiltered list. An absent or empty value is not
 * a filter - the URL validators already drop the invalid ones.
 */
export function countActiveFilters<TSearch extends object>(
  search: TSearch,
  keys: ReadonlyArray<keyof TSearch>,
): number {
  return keys.filter((key) => {
    const value = search[key]

    return value !== undefined && value !== null && value !== ''
  }).length
}
