/** What the collection slot refuses, as a fact (`_standards/domain.md` §2). */
export type CollectionScheduleError =
  /** The neighborhood already has this waste type on this weekday and shift: the check and the race on the `unique`. */
  { readonly code: 'SCHEDULE_ALREADY_EXISTS' }
