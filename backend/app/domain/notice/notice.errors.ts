/** What the notice refuses, as a fact (`_standards/domain.md` §2). */
export type NoticeError =
  /** The end is not after the start: the notice would never show. */
  | { readonly code: 'NOTICE_INVALID_PERIOD' }
  | { readonly code: 'NOTICE_ALREADY_CLOSED' }
