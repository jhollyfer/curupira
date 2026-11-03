/** A neighborhood center, as the nearest-match needs it. */
export type NeighborhoodCenter = {
  readonly id: string
  readonly latitude: number
  readonly longitude: number
}

const EARTH_RADIUS_KM = 6371

/**
 * Past this distance the report is filed under no neighborhood: the city is small, so a
 * pin tens of kilometers from every center is a mistake or a different city, and
 * attributing it to the least far neighborhood would put noise in that team's queue.
 */
export const NEAREST_MAX_KM = 20

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Haversine distance, in kilometers. */
export function distanceKm(
  from: { readonly latitude: number; readonly longitude: number },
  to: { readonly latitude: number; readonly longitude: number },
): number {
  const dLat = radians(to.latitude - from.latitude)
  const dLon = radians(to.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(dLon / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

/**
 * The id of the center closest to the point, or `null` when there is none within
 * `NEAREST_MAX_KM`. Shared by the Lucid and the in-memory repository so the two cannot
 * answer differently.
 */
export class NearestNeighborhood {
  static of(
    point: { readonly latitude: number; readonly longitude: number },
    centers: ReadonlyArray<NeighborhoodCenter>,
  ): string | null {
    let best: { id: string; km: number } | null = null

    for (const center of centers) {
      const km = distanceKm(point, center)
      if (km <= NEAREST_MAX_KM && (best === null || km < best.km))
        best = { id: center.id, km }
    }

    return best?.id ?? null
  }
}
