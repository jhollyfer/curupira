/** What the report refuses, as a fact (`_standards/domain.md` §2). */
export type ReportError =
  /** The status only moves forward: going back (or repeating) would rewrite what the resident already read. */
  | { readonly code: 'REPORT_STATUS_REGRESSION' }
  /** The drawn protocol already belongs to another report: the race on the `unique`, retried with a new draw. */
  | { readonly code: 'REPORT_PROTOCOL_TAKEN' }
  /** A photo was already attached to another report: one upload serves one report. */
  | { readonly code: 'REPORT_PHOTO_TAKEN' }
