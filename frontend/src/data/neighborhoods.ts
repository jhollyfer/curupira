import type { StorefrontNeighborhoodShowResponse } from '@curupira/shared'

import { exampleUuid } from './ids'

/**
 * EXAMPLE DATA - to be checked with the city hall of Benjamin Constant/AM.
 *
 * The names are the real neighborhoods; the coordinates are an approximate point near
 * each one (good enough to center the map), and the grouping used by
 * `data/schedules.ts` is invented. Nothing here is an official source. When the API
 * answers (`VITE_DATA_SOURCE=api`), this file stops being read.
 */
const ROWS = [
  ['Centro', -4.3836, -70.0311],
  ['Cohab', -4.3869, -70.0392],
  ['Umariaçu', -4.3808, -69.9922],
  ['Porto Cajuí', -4.376, -70.022],
  ['São Francisco', -4.3905, -70.027],
  ['Bom Jesus', -4.388, -70.0345],
  ['Nazaré', -4.382, -70.036],
  ['Ibirapuera', -4.3935, -70.04],
  ['Santa Rita', -4.385, -70.045],
  ['Colônia', -4.397, -70.032],
  ['Livramento', -4.379, -70.029],
  ['Prosperidade', -4.3925, -70.023],
] as const

function slugOf(name: string): string {
  return name
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
}

export const NEIGHBORHOODS: ReadonlyArray<StorefrontNeighborhoodShowResponse> =
  ROWS.map(([name, latitude, longitude], index) => ({
    id: exampleUuid('a', index + 1),
    name,
    slug: slugOf(name),
    latitude,
    longitude,
  }))
