/**
 * Where the town is and how to ask the phone where the resident stands.
 *
 * The coordinate of a report is the one the resident confirmed on the map, never one
 * read from the photo's EXIF (the shared contract says so), so this file only offers
 * the device GPS as a first guess for the pin.
 */

export type Coordinate = Readonly<{ latitude: number; longitude: number }>

/** Benjamin Constant/AM, the center of every map. */
export const TOWN_CENTER: Coordinate = {
  latitude: -4.3836,
  longitude: -70.0311,
}

/**
 * A box around the urban area and the river banks, in degrees. The map cannot be
 * dragged out of it and a pin dropped outside is pulled back in: a report pinned in
 * another country by a bad GPS fix would never be attended by this city hall.
 */
export const TOWN_BOUNDS = {
  south: -4.46,
  west: -70.12,
  north: -4.3,
  east: -69.95,
} as const

export const TOWN_ZOOM = 14

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * A pair of form numbers as a coordinate, or `undefined` while either is missing. The
 * form state types them as numbers, but an unplaced pin leaves them `undefined` at
 * runtime - `Number.isFinite` is the check that is true to both.
 */
export function toCoordinate(
  latitude: number | undefined,
  longitude: number | undefined,
): Coordinate | undefined {
  if (latitude === undefined || longitude === undefined) return undefined
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined

  return { latitude, longitude }
}

export function isInsideTown({ latitude, longitude }: Coordinate): boolean {
  return (
    latitude >= TOWN_BOUNDS.south &&
    latitude <= TOWN_BOUNDS.north &&
    longitude >= TOWN_BOUNDS.west &&
    longitude <= TOWN_BOUNDS.east
  )
}

/** The nearest point inside the box. */
export function clampToTown({ latitude, longitude }: Coordinate): Coordinate {
  return {
    latitude: clamp(latitude, TOWN_BOUNDS.south, TOWN_BOUNDS.north),
    longitude: clamp(longitude, TOWN_BOUNDS.west, TOWN_BOUNDS.east),
  }
}

export type GeoFailure = 'denied' | 'unavailable' | 'timeout'

/** `GeolocationPositionError.code` to the cases the screen distinguishes. */
const FAILURE_BY_CODE: Record<number, GeoFailure | undefined> = {
  1: 'denied',
  2: 'unavailable',
  3: 'timeout',
}

export class GeoError extends Error {
  readonly reason: GeoFailure

  constructor(reason: GeoFailure) {
    super(reason)
    this.name = 'GeoError'
    this.reason = reason
  }
}

/** Ten seconds: past that a resident on a weak GPS prefers to drag the pin. */
const GEO_TIMEOUT = 10_000

/** The device position as a promise; rejects with a `GeoError`. */
export function currentPosition(): Promise<Coordinate> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeoError('unavailable'))

      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new GeoError(FAILURE_BY_CODE[error.code] ?? 'unavailable')),
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT, maximumAge: 30_000 },
    )
  })
}
