/**
 * Where a report is. The order is the order of the timeline the resident follows:
 * received, in review, forwarded to the responsible body, resolved. The status only
 * moves forward through `management/reports/update-status`.
 */
export const REPORT_STATUS = {
  RECEIVED: 'RECEIVED',
  IN_REVIEW: 'IN_REVIEW',
  FORWARDED: 'FORWARDED',
  RESOLVED: 'RESOLVED',
} as const

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS]

/** In timeline order. */
export const REPORT_STATUSES = [
  REPORT_STATUS.RECEIVED,
  REPORT_STATUS.IN_REVIEW,
  REPORT_STATUS.FORWARDED,
  REPORT_STATUS.RESOLVED,
] as const

/**
 * The statuses the public map shows: what is being handled and what is done. A report
 * only `RECEIVED` stays off the map until someone looks at it, so a hoax or a
 * misplaced pin never shows to the public.
 */
export const REPORT_PUBLIC_STATUSES = [
  REPORT_STATUS.IN_REVIEW,
  REPORT_STATUS.FORWARDED,
  REPORT_STATUS.RESOLVED,
] as const
