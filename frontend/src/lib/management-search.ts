import type {
  ActiveStatus,
  NoticeStatus,
  ReportKind,
  ReportStatus,
  UserRole,
} from '@curupira/shared'
import { DateTime } from 'luxon'

import { TOWN_TIME_ZONE } from './i18n'
import { validateStorefrontSearch } from './list-search'
import type { StorefrontSearch } from './list-search'

/**
 * The URL filters of every panel listing.
 *
 * `StorefrontSearch` (no `trashed`) is the base for all of them: none of the management
 * resources here is archived, so a `?trashed` the URL accepts would be a filter the
 * backend refuses with 422. Enum values enter as **types** only and the accepted
 * spellings are literal maps - reading the shared enums at module scope would put this
 * file, which every panel route reaches, in a chunk cycle (see `list-search.ts`).
 *
 * Each validator discards an invalid parameter instead of throwing: the URL is typed by
 * anyone, and a router `validateSearch` that throws shows an error page for a typo.
 */

const REPORT_KIND_BY_TEXT: Record<string, ReportKind | undefined> = {
  BURNING: 'BURNING',
  DUMPING: 'DUMPING',
  DEFORESTATION: 'DEFORESTATION',
  OTHER: 'OTHER',
}

const REPORT_STATUS_BY_TEXT: Record<string, ReportStatus | undefined> = {
  RECEIVED: 'RECEIVED',
  IN_REVIEW: 'IN_REVIEW',
  FORWARDED: 'FORWARDED',
  RESOLVED: 'RESOLVED',
}

const NOTICE_STATUS_BY_TEXT: Record<string, NoticeStatus | undefined> = {
  SCHEDULED: 'SCHEDULED',
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
}

const USER_ROLE_BY_TEXT: Record<string, UserRole | undefined> = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  OPERATOR: 'OPERATOR',
}

const ACTIVE_STATUS_BY_TEXT: Record<string, ActiveStatus | undefined> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The sortable columns the backend accepts (`REPORT_SORT_COLUMNS` in `shared/`). */
const REPORT_SORT_KEYS: Record<string, string | undefined> = {
  createdAt: 'createdAt',
  status: 'status',
  kind: 'kind',
}

function uuidOf(value: unknown): string | undefined {
  if (typeof value !== 'string' || !UUID.test(value)) return undefined

  return value
}

/** `yyyy-MM-dd` only: the date input's value, and what the URL carries. */
function dayOf(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined

  const parsed = DateTime.fromFormat(value, 'yyyy-LL-dd', {
    zone: TOWN_TIME_ZONE,
  })
  if (!parsed.isValid) return undefined

  return parsed.toFormat('yyyy-LL-dd')
}

export type ReportsSearch = StorefrontSearch & {
  kind?: ReportKind
  status?: ReportStatus
  neighborhoodId?: string
  /** First day of the period, `yyyy-MM-dd`, in the town's time zone. */
  from?: string
  /** Last day of the period (inclusive), `yyyy-MM-dd`. */
  to?: string
}

export function validateReportsSearch(
  search: Record<string, unknown>,
): ReportsSearch {
  const result: ReportsSearch = validateStorefrontSearch(search)

  const kind = REPORT_KIND_BY_TEXT[String(search.kind)]
  if (kind) result.kind = kind

  const status = REPORT_STATUS_BY_TEXT[String(search.status)]
  if (status) result.status = status

  const neighborhoodId = uuidOf(search.neighborhoodId)
  if (neighborhoodId) result.neighborhoodId = neighborhoodId

  const from = dayOf(search.from)
  if (from) result.from = from

  const to = dayOf(search.to)
  // An inverted period matches nothing and looks like a broken filter: the end is dropped.
  if (to && (!from || to >= from)) result.to = to

  // The backend closes the sortable columns; a column outside them would be a 422.
  if (result.sort && !REPORT_SORT_KEYS[result.sort]) {
    delete result.sort
    delete result.direction
  }

  return result
}

/**
 * The period of the URL as the instants the API takes: the start of the first day and
 * the end of the last one, both in the town's zone (UTC-5 has no daylight saving, but
 * the day boundary still is not UTC's).
 */
export function reportPeriod(search: Pick<ReportsSearch, 'from' | 'to'>): {
  from?: string
  to?: string
} {
  const period: { from?: string; to?: string } = {}

  if (search.from) {
    const start = DateTime.fromFormat(search.from, 'yyyy-LL-dd', {
      zone: TOWN_TIME_ZONE,
    }).startOf('day')
    period.from = start.toISO({ suppressMilliseconds: true }) ?? undefined
  }

  if (search.to) {
    const end = DateTime.fromFormat(search.to, 'yyyy-LL-dd', {
      zone: TOWN_TIME_ZONE,
    })
      .endOf('day')
      // The API's instants carry whole seconds; `.999` would round-trip as a different filter.
      .set({ millisecond: 0 })
    period.to = end.toISO({ suppressMilliseconds: true }) ?? undefined
  }

  return period
}

/** The filters the map and the table share: the same cut, so they never disagree. */
export type ReportsFilter = Pick<
  ReportsSearch,
  'kind' | 'status' | 'neighborhoodId' | 'from' | 'to'
>

export function reportsFilterOf(search: ReportsSearch): ReportsFilter {
  const filter: ReportsFilter = {}

  if (search.kind) filter.kind = search.kind
  if (search.status) filter.status = search.status
  if (search.neighborhoodId) filter.neighborhoodId = search.neighborhoodId
  if (search.from) filter.from = search.from
  if (search.to) filter.to = search.to

  return filter
}

export function hasReportsFilter(search: ReportsSearch): boolean {
  return Object.keys(reportsFilterOf(search)).length > 0
}

export type NoticesSearch = StorefrontSearch & { status?: NoticeStatus }

export function validateNoticesSearch(
  search: Record<string, unknown>,
): NoticesSearch {
  const result: NoticesSearch = validateStorefrontSearch(search)

  const status = NOTICE_STATUS_BY_TEXT[String(search.status)]
  if (status) result.status = status

  return result
}

export type UsersSearch = StorefrontSearch & {
  role?: UserRole
  status?: ActiveStatus
}

export function validateUsersSearch(
  search: Record<string, unknown>,
): UsersSearch {
  const result: UsersSearch = validateStorefrontSearch(search)

  const role = USER_ROLE_BY_TEXT[String(search.role)]
  if (role) result.role = role

  const status = ACTIVE_STATUS_BY_TEXT[String(search.status)]
  if (status) result.status = status

  return result
}

export type SchedulesSearch = { neighborhoodId?: string }

export function validateSchedulesSearch(
  search: Record<string, unknown>,
): SchedulesSearch {
  const neighborhoodId = uuidOf(search.neighborhoodId)
  if (neighborhoodId) return { neighborhoodId }

  return {}
}
