import type {
  ManagementReportListItemResponse,
  ManagementReportMapPayload,
  ManagementReportPaginatePayload,
  ManagementReportShowResponse,
  ManagementReportStatsResponse,
  ManagementReportUpdateStatusPayload,
  Paginated,
} from '@curupira/shared'

import { HTTPError } from '#/integrations/tanstack-query/http'
import { townNow, townNowIso } from '#/lib/i18n'
import { canAdvance } from '#/lib/report-status'

import { matchesText, paginate, sortedBy } from './paginate'
import { MOCK_ADMINISTRATOR_ID } from './seed-users'
import { neighborhoodName, store } from './store'
import type { StoredReport } from './store'

/**
 * EXAMPLE DATA of the panel: occurrences, in memory. The status rule is the backend's -
 * it only moves forward, and going back or repeating is 422 `REPORT_STATUS_REGRESSION`
 * pointing at `status` - imported from `lib/report-status` so the mock and the screen
 * cannot disagree about what "forward" is.
 */
type Filter = Pick<
  ManagementReportMapPayload,
  'kind' | 'status' | 'neighborhoodId' | 'from' | 'to'
>

function listItem(row: StoredReport): ManagementReportListItemResponse {
  return {
    id: row.id,
    protocol: row.protocol,
    kind: row.kind,
    status: row.status,
    latitude: row.latitude,
    longitude: row.longitude,
    neighborhoodId: row.neighborhoodId,
    neighborhoodName: neighborhoodName(row.neighborhoodId),
    createdAt: row.createdAt,
  }
}

function present(row: StoredReport): ManagementReportShowResponse {
  return { ...row, neighborhoodName: neighborhoodName(row.neighborhoodId) }
}

function matches(row: StoredReport, filter: Filter): boolean {
  if (filter.kind && row.kind !== filter.kind) return false
  if (filter.status && row.status !== filter.status) return false
  if (filter.neighborhoodId && row.neighborhoodId !== filter.neighborhoodId)
    return false

  const created = new Date(row.createdAt).getTime()
  if (filter.from && created < new Date(filter.from).getTime()) return false
  if (filter.to && created > new Date(filter.to).getTime()) return false

  return true
}

function notFound(): HTTPError {
  return new HTTPError({
    message: 'Ocorrência não encontrada',
    status: 404,
    code: 'REPORT_NOT_FOUND',
  })
}

export function listReports(
  query: ManagementReportPaginatePayload,
): Paginated<ManagementReportListItemResponse> {
  const filtered = store.reports
    .filter((row) => matches(row, query))
    .filter((row) => matchesText([row.protocol, row.description], query.search))

  const sorted = sortedBy(
    filtered,
    (row) => {
      if (query.sort === 'status') return row.status
      if (query.sort === 'kind') return row.kind

      return row.createdAt
    },
    query.direction ?? 'desc',
  )
  const page = paginate(sorted, query)

  return { meta: page.meta, data: page.data.map(listItem) }
}

/** The pins: the same filter as the table, no pagination. */
export function mapReports(
  query: ManagementReportMapPayload,
): Array<ManagementReportListItemResponse> {
  return store.reports.filter((row) => matches(row, query)).map(listItem)
}

export function findReport(id: string): ManagementReportShowResponse {
  const found = store.reports.find((row) => row.id === id)
  if (!found) throw notFound()

  return present(found)
}

export function reportStats(): ManagementReportStatsResponse {
  const byKind = { BURNING: 0, DUMPING: 0, DEFORESTATION: 0, OTHER: 0 }
  const byStatus = { RECEIVED: 0, IN_REVIEW: 0, FORWARDED: 0, RESOLVED: 0 }
  const perDay = new Map<string, number>()
  const since = townNow().minus({ days: 29 }).startOf('day').toMillis()

  for (const row of store.reports) {
    byKind[row.kind] += 1
    byStatus[row.status] += 1

    if (new Date(row.createdAt).getTime() < since) continue

    const day = row.createdAt.slice(0, 10)
    perDay.set(day, (perDay.get(day) ?? 0) + 1)
  }

  return {
    total: store.reports.length,
    byKind,
    byStatus,
    lastThirtyDays: Array.from(perDay, ([day, total]) => ({ day, total })).sort(
      (a, b) => a.day.localeCompare(b.day),
    ),
  }
}

export function updateReportStatus(
  id: string,
  payload: ManagementReportUpdateStatusPayload,
): ManagementReportShowResponse {
  const current = store.reports.find((row) => row.id === id)
  if (!current) throw notFound()

  if (!canAdvance(current.status, payload.status)) {
    throw new HTTPError({
      message: 'O status só pode avançar',
      status: 422,
      code: 'REPORT_STATUS_REGRESSION',
      errors: { status: 'O status só pode avançar' },
    })
  }

  const author = store.users.find((row) => row.id === MOCK_ADMINISTRATOR_ID)
  const at = townNowIso()
  const updated: StoredReport = {
    ...current,
    status: payload.status,
    events: [
      ...current.events,
      {
        status: payload.status,
        message: payload.message || null,
        authorName: author?.name ?? null,
        at,
      },
    ],
    updatedAt: at,
  }
  store.reports = store.reports.map((row) => {
    if (row.id === id) return updated

    return row
  })

  return present(updated)
}
