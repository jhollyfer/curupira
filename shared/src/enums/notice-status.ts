/** A notice, by its dates: not yet showing, showing, or over (ended or closed by hand). */
export const NOTICE_STATUS = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
} as const

export type NoticeStatus = (typeof NOTICE_STATUS)[keyof typeof NOTICE_STATUS]

export const NOTICE_STATUSES = Object.values(NOTICE_STATUS)
