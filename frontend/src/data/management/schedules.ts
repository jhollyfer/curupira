import type {
  ManagementScheduleCreatePayload,
  ManagementSchedulePaginatePayload,
  ManagementScheduleShowResponse,
  ManagementScheduleUpdatePayload,
  Paginated,
} from '@curupira/shared'

import { HTTPError } from '#/integrations/tanstack-query/http'
import { townNowIso } from '#/lib/i18n'

import { keep, paginate } from './paginate'
import { neighborhoodName, store } from './store'
import type { StoredSchedule } from './store'

/**
 * EXAMPLE DATA of the panel: the collection schedule, in memory. The real table's
 * `unique` is (neighborhood, waste type, weekday, shift): two equal slots answer 409
 * `SCHEDULE_ALREADY_EXISTS` pointing at `weekday`, and the form must show it there.
 */
function present(row: StoredSchedule): ManagementScheduleShowResponse {
  return {
    ...row,
    neighborhoodName: neighborhoodName(row.neighborhoodId) ?? '',
  }
}

function notFound(): HTTPError {
  return new HTTPError({
    message: 'Coleta não encontrada',
    status: 404,
    code: 'SCHEDULE_NOT_FOUND',
  })
}

function assertFree(
  slot: Pick<
    StoredSchedule,
    'neighborhoodId' | 'wasteType' | 'weekday' | 'shift'
  >,
  ignoreId?: string,
): void {
  const taken = store.schedules.some(
    (row) =>
      row.id !== ignoreId &&
      row.neighborhoodId === slot.neighborhoodId &&
      row.wasteType === slot.wasteType &&
      row.weekday === slot.weekday &&
      row.shift === slot.shift,
  )
  if (!taken) return

  throw new HTTPError({
    message: 'Esta coleta já está cadastrada para o bairro',
    status: 409,
    code: 'SCHEDULE_ALREADY_EXISTS',
    errors: { weekday: 'Já existe esta coleta neste dia e turno' },
  })
}

function assertNeighborhoodExists(id: string): void {
  if (neighborhoodName(id) !== null) return

  throw new HTTPError({
    message: 'Bairro não encontrado',
    status: 404,
    code: 'NEIGHBORHOOD_NOT_FOUND',
  })
}

export function listSchedules(
  query: ManagementSchedulePaginatePayload,
): Paginated<ManagementScheduleShowResponse> {
  const filtered = store.schedules.filter((row) => {
    if (!query.neighborhoodId) return true

    return row.neighborhoodId === query.neighborhoodId
  })
  const page = paginate(filtered, query)

  return { meta: page.meta, data: page.data.map(present) }
}

export function findSchedule(id: string): ManagementScheduleShowResponse {
  const found = store.schedules.find((row) => row.id === id)
  if (!found) throw notFound()

  return present(found)
}

export function createSchedule(
  payload: ManagementScheduleCreatePayload,
): ManagementScheduleShowResponse {
  assertNeighborhoodExists(payload.neighborhoodId)
  assertFree(payload)

  const created: StoredSchedule = {
    id: crypto.randomUUID(),
    neighborhoodId: payload.neighborhoodId,
    wasteType: payload.wasteType,
    weekday: payload.weekday,
    shift: payload.shift,
    note: payload.note ?? null,
    createdAt: townNowIso(),
    updatedAt: null,
  }
  store.schedules = [...store.schedules, created]

  return present(created)
}

export function updateSchedule(
  id: string,
  payload: ManagementScheduleUpdatePayload,
): ManagementScheduleShowResponse {
  const current = findSchedule(id)
  const next = {
    neighborhoodId: keep(payload.neighborhoodId, current.neighborhoodId),
    wasteType: keep(payload.wasteType, current.wasteType),
    weekday: keep(payload.weekday, current.weekday),
    shift: keep(payload.shift, current.shift),
  }
  assertNeighborhoodExists(next.neighborhoodId)
  assertFree(next, id)

  const updated: StoredSchedule = {
    id: current.id,
    ...next,
    note: keep(payload.note, current.note),
    createdAt: current.createdAt,
    updatedAt: townNowIso(),
  }
  store.schedules = store.schedules.map((row) => {
    if (row.id === id) return updated

    return row
  })

  return present(updated)
}

export function deleteSchedule(id: string): void {
  findSchedule(id)
  store.schedules = store.schedules.filter((row) => row.id !== id)
}
