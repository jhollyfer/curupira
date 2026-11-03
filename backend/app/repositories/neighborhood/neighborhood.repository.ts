import type {
  Either,
  ManagementNeighborhoodShowResponse,
  Paginated,
  SortDirection,
  StorefrontNeighborhoodShowResponse,
} from '@curupira/shared'

import type { Neighborhood } from '#domain/neighborhood/neighborhood.entity'
import type { NeighborhoodError } from '#domain/neighborhood/neighborhood.errors'

export type NeighborhoodListCriteria = {
  readonly page: number
  readonly perPage: number
  readonly search?: string
  readonly sort: 'name' | 'createdAt'
  readonly direction: SortDirection
}

/**
 * The neighborhood persistence, by intent (`_standards/domain.md` §5.1). The single writer
 * of the `neighborhoods` table; it reads schedules only to answer what the delete rule asks.
 */
export abstract class NeighborhoodRepository {
  abstract findById(id: string): Promise<Neighborhood | null>
  /** Another neighborhood, other than `exceptId`, already uses the name or the slug. */
  abstract existsByNameOrSlug(
    name: string,
    slug: string,
    exceptId?: string,
  ): Promise<boolean>
  /** Has collection slots: deleting would erase the schedule residents read. */
  abstract hasSchedules(id: string): Promise<boolean>
  /**
   * The neighborhood whose center is closest to the point (within `NEAREST_MAX_KM`), or
   * `null` when none has a center near enough. Only the id leaves: a public report must
   * never learn more than that about the match.
   */
  abstract nearestTo(point: {
    readonly latitude: number
    readonly longitude: number
  }): Promise<string | null>
  /** Saves the neighborhood; the name or slug of another (the race on the `unique`) comes back as a fact. */
  abstract save(
    neighborhood: Neighborhood,
  ): Promise<Either<NeighborhoodError, void>>
  abstract delete(neighborhood: Neighborhood): Promise<void>
  /** Lightweight read: the response shape straight from the query, without hydrating an entity. */
  abstract paginate(
    criteria: NeighborhoodListCriteria,
  ): Promise<Paginated<ManagementNeighborhoodShowResponse>>
  /** Every neighborhood, by name: the city has a few dozen, and the site needs them all to pick one. */
  abstract listAll(): Promise<StorefrontNeighborhoodShowResponse[]>
}
