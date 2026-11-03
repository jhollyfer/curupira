import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { left, right } from '@curupira/shared'
import type {
  Either,
  ManagementNeighborhoodShowResponse,
  Paginated,
  StorefrontNeighborhoodShowResponse,
} from '@curupira/shared'

import {
  NeighborhoodRepository,
  type NeighborhoodListCriteria,
} from './neighborhood.repository.ts'

import NeighborhoodModel from '#models/neighborhood'
import { PostgresError } from '#core/postgres-error'
import { TransactionContext } from '#core/transaction-context'
import { Neighborhood } from '#domain/neighborhood/neighborhood.entity'
import type { NeighborhoodError } from '#domain/neighborhood/neighborhood.errors'
import { NearestNeighborhood } from '#domain/neighborhood/nearest-neighborhood'

@inject()
export class NeighborhoodLucidRepository extends NeighborhoodRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<Neighborhood | null> {
    const row = await this.query().where('id', id).first()
    if (!row) return null

    return this.toEntity(row)
  }

  async existsByNameOrSlug(
    name: string,
    slug: string,
    exceptId?: string,
  ): Promise<boolean> {
    const query = this.query().where((builder) => {
      builder.where('name', name).orWhere('slug', slug)
    })
    if (exceptId) query.whereNot('id', exceptId)

    return Boolean(await query.first())
  }

  async hasSchedules(id: string): Promise<boolean> {
    const row = await this.transaction
      .client()
      .from('collection_schedules')
      .where('neighborhood_id', id)
      .first()

    return Boolean(row)
  }

  async nearestTo(point: {
    readonly latitude: number
    readonly longitude: number
  }): Promise<string | null> {
    const rows = await this.query()
      .whereNotNull('latitude')
      .whereNotNull('longitude')

    return NearestNeighborhood.of(
      point,
      rows.flatMap((row) => {
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
    const { id, createdAt, updatedAt, ...columns } = neighborhood.snapshot()

    try {
      await NeighborhoodModel.updateOrCreate(
        { id },
        {
          ...columns,
          createdAt: DateTime.fromJSDate(createdAt),
          updatedAt: this.dateOrNull(updatedAt),
        },
        { client: this.transaction.client() },
      )

      return right(undefined)
    } catch (error) {
      if (PostgresError.isUniqueViolation(error))
        return left({ code: 'NEIGHBORHOOD_ALREADY_EXISTS' })

      throw error
    }
  }

  async delete(neighborhood: Neighborhood): Promise<void> {
    await this.query().where('id', neighborhood.id).delete()
  }

  async paginate(
    criteria: NeighborhoodListCriteria,
  ): Promise<Paginated<ManagementNeighborhoodShowResponse>> {
    const query = this.query()
    if (criteria.search) query.whereILike('name', `%${criteria.search}%`)

    const page = await query
      .orderBy(criteria.sort, criteria.direction)
      .paginate(criteria.page, criteria.perPage)

    return {
      meta: page.getMeta(),
      data: page.all().map((row) => this.toResponse(row)),
    }
  }

  async listAll(): Promise<StorefrontNeighborhoodShowResponse[]> {
    const rows = await this.query().orderBy('name', 'asc')

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      latitude: row.latitude,
      longitude: row.longitude,
    }))
  }

  private query() {
    return NeighborhoodModel.query({ client: this.transaction.client() })
  }

  private toEntity(row: NeighborhoodModel): Neighborhood {
    return Neighborhood.restore({
      id: row.id,
      name: row.name,
      slug: row.slug,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: row.updatedAt?.toJSDate() ?? null,
    })
  }

  private toResponse(
    row: NeighborhoodModel,
  ): ManagementNeighborhoodShowResponse {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      latitude: row.latitude,
      longitude: row.longitude,
      createdAt: row.createdAt.toISO() ?? '',
      updatedAt: row.updatedAt?.toISO() ?? null,
    }
  }

  private dateOrNull(date: Date | null): DateTime | null {
    if (!date) return null

    return DateTime.fromJSDate(date)
  }
}
