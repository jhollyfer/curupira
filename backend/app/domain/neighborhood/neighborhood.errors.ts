/**
 * What the neighborhood refuses, as a fact (`_standards/domain.md` §2): no HTTP status or
 * screen text. The use case translates each one.
 */
export type NeighborhoodError =
  /** The name or slug belongs to another neighborhood: the check before saving and the race on the `unique`. */
  | { readonly code: 'NEIGHBORHOOD_ALREADY_EXISTS' }
  /** One coordinate without the other: half a center places nothing on the map. */
  | { readonly code: 'NEIGHBORHOOD_CENTER_INCOMPLETE' }
  /** It still has collection slots: deleting would erase the schedule residents read. */
  | { readonly code: 'NEIGHBORHOOD_IN_USE' }
