import type { ManagementNeighborhoodShowResponse } from '@curupira/shared'

import type { Neighborhood } from '#domain/neighborhood/neighborhood.entity'

/**
 * The neighborhood in the shape of the `shared/` response (`_standards/architecture.md`
 * §10): the presenter is typed by the same schema that OpenAPI and the frontend read, so
 * a field that is not in it does not reach the response.
 */
export class NeighborhoodPresenter {
  static show(neighborhood: Neighborhood): ManagementNeighborhoodShowResponse {
    const { id, name, slug, latitude, longitude, createdAt, updatedAt } = neighborhood.snapshot()

    return {
      id,
      name,
      slug,
      latitude,
      longitude,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt?.toISOString() ?? null,
    }
  }
}
