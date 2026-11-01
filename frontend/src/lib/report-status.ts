import type { ReportStatus } from '@curupira/shared'

/**
 * The only direction a report moves: received, in review, forwarded, resolved. The
 * backend refuses anything else with `REPORT_STATUS_REGRESSION` (422); this mirror
 * exists so the panel explains the refusal *before* the click instead of after it.
 *
 * Literal order and not `REPORT_STATUSES.indexOf`: the enum would enter at module
 * scope in a file the table and the detail both reach (chunk cycle, see
 * `list-search.ts`). `satisfies` is the net - a new status without a position fails.
 */
const ORDER = {
  RECEIVED: 0,
  IN_REVIEW: 1,
  FORWARDED: 2,
  RESOLVED: 3,
} satisfies Record<ReportStatus, number>

export const STATUS_FLOW: ReadonlyArray<ReportStatus> = [
  'RECEIVED',
  'IN_REVIEW',
  'FORWARDED',
  'RESOLVED',
]

export type StatusBlock = 'current' | 'regression'

export type StatusOption = Readonly<{
  status: ReportStatus
  /** Why the option is disabled; absent when it can be chosen. */
  blocked?: StatusBlock
}>

/** Skipping steps is allowed (forwarding straight from received); going back is not. */
export function canAdvance(current: ReportStatus, next: ReportStatus): boolean {
  return ORDER[next] > ORDER[current]
}

export function statusOptions(
  current: ReportStatus,
): ReadonlyArray<StatusOption> {
  return STATUS_FLOW.map((status): StatusOption => {
    if (status === current) return { status, blocked: 'current' }
    if (!canAdvance(current, status)) return { status, blocked: 'regression' }

    return { status }
  })
}

export function isFinal(current: ReportStatus): boolean {
  return current === 'RESOLVED'
}

/** Waiting for a first look: what the overview shortcut and the badge count. */
export function isUntreated(status: ReportStatus): boolean {
  return status === 'RECEIVED'
}
