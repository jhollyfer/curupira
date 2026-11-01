import type {
  ManagementNeighborhoodCreatePayload,
  ManagementNeighborhoodPaginatePayload,
  ManagementNeighborhoodShowResponse,
  ManagementNeighborhoodUpdatePayload,
  Paginated,
} from '@curupira/shared'

import { HTTPError } from '#/integrations/tanstack-query/http'
import { townNowIso } from '#/lib/i18n'

import { keep, matchesText, paginate, sortedBy } from './paginate'
import { store } from './store'

/**
 * EXAMPLE DATA of the panel: neighborhoods, in memory. The refusals copy the backend's
 * codes (`NEIGHBORHOOD_ALREADY_EXISTS`, `NEIGHBORHOOD_IN_USE`...), so the screens' error
 * handling is exercised against the real vocabulary and not a friendlier stand-in.
 */
function slugOf(name: string): string {
  return name
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replaceAll(/\s+/g, '-')
}

function assertFreeName(name: string, ignoreId?: string): void {
  const taken = store.neighborhoods.some(
    (row) => row.id !== ignoreId && row.slug === slugOf(name),
  )
  if (!taken) return

  throw new HTTPError({
    message: 'Já existe um bairro com este nome',
    status: 409,
    code: 'NEIGHBORHOOD_ALREADY_EXISTS',
    errors: { name: 'Já existe um bairro com este nome' },
  })
}

/** The backend refuses half a center: both coordinates or none. */
function assertCompleteCenter(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): void {
  const hasLatitude = latitude !== null && latitude !== undefined
  const hasLongitude = longitude !== null && longitude !== undefined
  if (hasLatitude === hasLongitude) return

  throw new HTTPError({
    message: 'Informe latitude e longitude juntas',
    status: 422,
    code: 'NEIGHBORHOOD_CENTER_INCOMPLETE',
    errors: { latitude: 'Informe latitude e longitude juntas' },
  })
}

function notFound(): HTTPError {
  return new HTTPError({
    message: 'Bairro não encontrado',
    status: 404,
    code: 'NEIGHBORHOOD_NOT_FOUND',
  })
}

export function listNeighborhoods(
  query: ManagementNeighborhoodPaginatePayload,
): Paginated<ManagementNeighborhoodShowResponse> {
  const filtered = store.neighborhoods.filter((row) =>
    matchesText([row.name], query.search),
  )
  const sorted = sortedBy(
    filtered,
    (row) => {
      if (query.sort === 'createdAt') return row.createdAt

      return row.name
    },
    query.direction,
  )

  return paginate(sorted, query)
}

export function allNeighborhoods(): ReadonlyArray<ManagementNeighborhoodShowResponse> {
  return sortedBy(store.neighborhoods, (row) => row.name, 'asc')
}

export function findNeighborhood(
  id: string,
): ManagementNeighborhoodShowResponse {
  const found = store.neighborhoods.find((row) => row.id === id)
  if (!found) throw notFound()

  return found
}

export function createNeighborhood(
  payload: ManagementNeighborhoodCreatePayload,
): ManagementNeighborhoodShowResponse {
  assertFreeName(payload.name)
  assertCompleteCenter(payload.latitude, payload.longitude)

  const created: ManagementNeighborhoodShowResponse = {
    id: crypto.randomUUID(),
    name: payload.name,
    slug: slugOf(payload.name),
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    createdAt: townNowIso(),
    updatedAt: null,
  }
  store.neighborhoods = [...store.neighborhoods, created]

  return created
}

export function updateNeighborhood(
  id: string,
  payload: ManagementNeighborhoodUpdatePayload,
): ManagementNeighborhoodShowResponse {
  const current = findNeighborhood(id)
  const name = keep(payload.name, current.name)
  assertFreeName(name, id)

  const latitude = keep(payload.latitude, current.latitude)
  const longitude = keep(payload.longitude, current.longitude)
  assertCompleteCenter(latitude, longitude)

  const updated: ManagementNeighborhoodShowResponse = {
    ...current,
    name,
    slug: slugOf(name),
    latitude,
    longitude,
    updatedAt: townNowIso(),
  }
  store.neighborhoods = store.neighborhoods.map((row) => {
    if (row.id === id) return updated

    return row
  })

  return updated
}

export function deleteNeighborhood(id: string): void {
  findNeighborhood(id)

  if (store.schedules.some((row) => row.neighborhoodId === id)) {
    throw new HTTPError({
      message: 'O bairro tem coletas cadastradas e não pode ser removido',
      status: 409,
      code: 'NEIGHBORHOOD_IN_USE',
    })
  }

  store.neighborhoods = store.neighborhoods.filter((row) => row.id !== id)
}
