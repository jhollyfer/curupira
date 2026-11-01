import type {
  ManagementNoticeCreatePayload,
  ManagementNoticePaginatePayload,
  ManagementNoticeShowResponse,
  ManagementNoticeUpdatePayload,
  NoticeStatus,
  Paginated,
} from '@curupira/shared'

import { HTTPError } from '#/integrations/tanstack-query/http'
import { townNow, townNowIso } from '#/lib/i18n'

import { keep, matchesText, paginate, sortedBy } from './paginate'
import { store } from './store'

/**
 * EXAMPLE DATA of the panel: notices, in memory. The status is not stored: like the API's
 * presenter it is derived from the dates and `closedAt` every time a row is read, so a
 * notice scheduled for tomorrow turns ACTIVE by itself when the example clock gets there.
 */
type Dated = Pick<
  ManagementNoticeShowResponse,
  'startsAt' | 'endsAt' | 'closedAt'
>

export function statusOfNotice(row: Dated): NoticeStatus {
  const now = townNow().toMillis()

  if (row.closedAt) return 'CLOSED'
  if (new Date(row.startsAt).getTime() > now) return 'SCHEDULED'
  if (row.endsAt && new Date(row.endsAt).getTime() <= now) return 'CLOSED'

  return 'ACTIVE'
}

function present(
  row: ManagementNoticeShowResponse,
): ManagementNoticeShowResponse {
  return { ...row, status: statusOfNotice(row) }
}

function notFound(): HTTPError {
  return new HTTPError({
    message: 'Aviso não encontrado',
    status: 404,
    code: 'NOTICE_NOT_FOUND',
  })
}

function assertPeriod(startsAt: string, endsAt: string | null): void {
  if (endsAt === null) return
  if (new Date(endsAt).getTime() > new Date(startsAt).getTime()) return

  throw new HTTPError({
    message: 'O fim precisa ser depois do início',
    status: 422,
    code: 'NOTICE_INVALID_PERIOD',
    errors: { endsAt: 'O fim precisa ser depois do início' },
  })
}

export function listNotices(
  query: ManagementNoticePaginatePayload,
): Paginated<ManagementNoticeShowResponse> {
  const filtered = store.notices
    .map(present)
    .filter((row) => matchesText([row.title, row.body], query.search))
    .filter((row) => !query.status || row.status === query.status)

  const sorted = sortedBy(
    filtered,
    (row) => {
      if (query.sort === 'title') return row.title
      if (query.sort === 'createdAt') return row.createdAt

      return row.startsAt
    },
    query.direction ?? 'desc',
  )

  return paginate(sorted, query)
}

export function findNotice(id: string): ManagementNoticeShowResponse {
  const found = store.notices.find((row) => row.id === id)
  if (!found) throw notFound()

  return present(found)
}

export function createNotice(
  payload: ManagementNoticeCreatePayload,
): ManagementNoticeShowResponse {
  const endsAt = payload.endsAt ?? null
  assertPeriod(payload.startsAt, endsAt)

  const created: ManagementNoticeShowResponse = {
    id: crypto.randomUUID(),
    title: payload.title,
    body: payload.body,
    status: 'ACTIVE',
    startsAt: payload.startsAt,
    endsAt,
    closedAt: null,
    createdAt: townNowIso(),
    updatedAt: null,
  }
  store.notices = [...store.notices, created]

  return present(created)
}

export function updateNotice(
  id: string,
  payload: ManagementNoticeUpdatePayload,
): ManagementNoticeShowResponse {
  const current = findNotice(id)
  const startsAt = keep(payload.startsAt, current.startsAt)
  const endsAt = keep(payload.endsAt, current.endsAt)
  assertPeriod(startsAt, endsAt)

  const updated: ManagementNoticeShowResponse = {
    ...current,
    title: keep(payload.title, current.title),
    body: keep(payload.body, current.body),
    startsAt,
    endsAt,
    updatedAt: townNowIso(),
  }
  store.notices = store.notices.map((row) => {
    if (row.id === id) return updated

    return row
  })

  return present(updated)
}

export function closeNotice(id: string): ManagementNoticeShowResponse {
  const current = findNotice(id)

  if (current.status === 'CLOSED') {
    throw new HTTPError({
      message: 'O aviso já está encerrado',
      status: 409,
      code: 'NOTICE_ALREADY_CLOSED',
    })
  }

  const closed: ManagementNoticeShowResponse = {
    ...current,
    closedAt: townNowIso(),
    updatedAt: townNowIso(),
  }
  store.notices = store.notices.map((row) => {
    if (row.id === id) return closed

    return row
  })

  return present(closed)
}

export function deleteNotice(id: string): void {
  findNotice(id)
  store.notices = store.notices.filter((row) => row.id !== id)
}
