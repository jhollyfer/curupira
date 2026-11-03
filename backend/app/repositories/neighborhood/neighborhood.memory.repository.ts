import { left, right } from '@curupira/shared'
import type {
  Either,
  ManagementNeighborhoodShowResponse,
  Paginated,
  SortDirection,
  StorefrontNeighborhoodShowResponse,
} from '@curupira/shared'

import {
  NeighborhoodRepository,
  type NeighborhoodListCriteria,
} from './neighborhood.repository.ts'

import { MemoryPagination } from '#core/memory-pagination'
import {
  Neighborhood,
  type NeighborhoodProps,
} from '#domain/neighborhood/neighborhood.entity'
import type { NeighborhoodError } from '#domain/neighborhood/neighborhood.errors'
import { NearestNeighborhood } from '#domain/neighborhood/nearest-neighborhood'

/** The sign of the comparison by sort direction. */
const SIGN = { asc: 1, desc: -1 } satisfies Record<SortDirection, number>

/**
 * The second real implementation, for the use case unit test (`_standards/domain.md`
 * §5.3). It keeps copies: the test does not change the "database" by reference.
 */
export class NeighborhoodMemoryRepository extends NeighborhoodRepository {
  private readonly rows = new Map<string, NeighborhoodProps>()
  private readonly withSchedules = new Set<string>()

  /** Test arrangement: the neighborhood has collection slots. */
  markWithSchedules(id: string): this {
    this.withSchedules.add(id)
    return this
  }

  async findById(id: string): Promise<Neighborhood | null> {
    const props = this.rows.get(id)
    if (!props) return null

    return Neighborhood.restore(structuredClone(props))
  }

  async existsByNameOrSlug(
    name: string,
    slug: string,
    exceptId?: string,
  ): Promise<boolean> {
    return [...this.rows.values()].some(
      (row) => row.id !== exceptId && (row.name === name || row.slug === slug),
    )
  }

  async hasSchedules(id: string): Promise<boolean> {
    return this.withSchedules.has(id)
  }

  async nearestTo(point: {
    readonly latitude: number
    readonly longitude: number
  }): Promise<string | null> {
    return NearestNeighborhood.of(
      point,
      [...this.rows.values()].flatMap((row) => {
        if (row.latitude === null || row.longitude === null) return []

        return [
          { id: row.id, latitude: row.latitude, longitude: row.longitude },
        ]
      }),
    )
  }

  async save(
    neighborhood: Neighborhood,
  ): Promise<Either<NeighborhoodError, void>> {
    const snapshot = structuredClone(neighborhood.snapshot())
    const taken = [...this.rows.values()].some(
      (row) =>
        row.id !== snapshot.id &&
        (row.name === snapshot.name || row.slug === snapshot.slug),
    )
    // The name and slug `unique`s, as the database guarantees them.
    if (taken) return left({ code: 'NEIGHBORHOOD_ALREADY_EXISTS' })

    this.rows.set(snapshot.id, snapshot)

    return right(undefined)
  }

  async delete(neighborhood: Neighborhood): Promise<void> {
    this.rows.delete(neighborhood.id)
  }

  async paginate(
    criteria: NeighborhoodListCriteria,
  ): Promise<Paginated<ManagementNeighborhoodShowResponse>> {
    const search = criteria.search?.toLowerCase()
    const sign = SIGN[criteria.direction]
    const all = [...this.rows.values()]
      .filter((row) => !search || row.name.toLowerCase().includes(search))
      .sort(
        (a, b) =>
          sign *
          String(a[criteria.sort]).localeCompare(String(b[criteria.sort])),
      )
    const page = MemoryPagination.slice(all, criteria.page, criteria.perPage)

    return {
      meta: page.meta,
      data: page.data.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        latitude: row.latitude,
        longitude: row.longitude,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt?.toISOString() ?? null,
      })),
    }
  }

  async listAll(): Promise<StorefrontNeighborhoodShowResponse[]> {
    return [...this.rows.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        latitude: row.latitude,
        longitude: row.longitude,
      }))
  }
}
