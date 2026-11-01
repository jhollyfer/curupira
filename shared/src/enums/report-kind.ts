/** What the report is about. The alert colors are reserved for `BURNING`. */
export const REPORT_KIND = {
  BURNING: 'BURNING',
  DUMPING: 'DUMPING',
  DEFORESTATION: 'DEFORESTATION',
  OTHER: 'OTHER',
} as const

export type ReportKind = (typeof REPORT_KIND)[keyof typeof REPORT_KIND]

export const REPORT_KINDS = Object.values(REPORT_KIND)
