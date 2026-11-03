import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { COLLECTION_SHIFTS, WEEKDAYS, left, right } from '@curupira/shared'
import type {
  Either,
  ManagementScheduleShowResponse,
  Paginated,
  StorefrontScheduleShowResponse,
} from '@curupira/shared'

import {
  CollectionScheduleRepository,
  type ScheduleListCriteria,
  type ScheduleSlot,
} from './collection-schedule.repository.ts'

import ScheduleModel from '#models/collection-schedule'
import { PostgresError } from '#core/postgres-error'
import { TransactionContext } from '#core/transaction-context'
import { CollectionSchedule } from '#domain/collection-schedule/collection-schedule.entity'
import type { CollectionScheduleError } from '#domain/collection-schedule/collection-schedule.errors'

@inject()
export class CollectionScheduleLucidRepository extends CollectionScheduleRepository {
  constructor(private readonly transaction: TransactionContext) {
    super()
  }

  async findById(id: string): Promise<CollectionSchedule | null> {
    const row = await this.query().where('id', id).first()
    if (!row) return null

    return this.toEntity(row)
  }

  async existsSlot(slot: ScheduleSlot, exceptId?: string): Promise<boolean> {
    const query = this.query()
      .where('neighborhoodId', slot.neighborhoodId)
      .where('wasteType', slot.wasteType)
      .where('weekday', slot.weekday)
      .where('shift', slot.shift)
    if (exceptId) query.whereNot('id', exceptId)

    return Boolean(await query.first())
  }

  async save(
    schedule: CollectionSchedule,
  ): Promise<Either<CollectionScheduleError, void>> {
    const { id, createdAt, updatedAt, ...columns } = schedule.snapshot()

    try {
      await ScheduleModel.updateOrCreate(
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
        return left({ code: 'SCHEDULE_ALREADY_EXISTS' })

      throw error
    }
  }

  async delete(schedule: CollectionSchedule): Promise<void> {
    await this.query().where('id', schedule.id).delete()
  }

  async detail(id: string): Promise<ManagementScheduleShowResponse | null> {
    const row = await this.joined().where('collection_schedules.id', id).first()
    if (!row) return null

    return this.toResponse(row)
  }

  async paginate(
    criteria: ScheduleListCriteria,
  ): Promise<Paginated<ManagementScheduleShowResponse>> {
    const query = this.joined()
    if (criteria.neighborhoodId)
      query.where(
        'collection_schedules.neighborhood_id',
        criteria.neighborhoodId,
      )

    const page = await query
      .orderBy('neighborhoods.name', 'asc')
      .orderBy('collection_schedules.created_at', 'asc')
      .paginate(criteria.page, criteria.perPage)

    return {
      meta: page.getMeta(),
      data: page.all().map((row) => this.toResponse(row)),
    }
  }

  async listWeek(
    neighborhoodId?: string,
  ): Promise<StorefrontScheduleShowResponse[]> {
    const query = this.query()
    if (neighborhoodId) query.where('neighborhoodId', neighborhoodId)

    const rows = await query
    // Week order (Sunday first, like `Date#getDay`) and then the shift: the enum is
    // text in the database, so alphabetical would put FRIDAY before MONDAY.
    const ordered = rows.sort(
      (a, b) =>
        WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
        COLLECTION_SHIFTS.indexOf(a.shift) - COLLECTION_SHIFTS.indexOf(b.shift),
    )

    return ordered.map((row) => ({
      id: row.id,
      neighborhoodId: row.neighborhoodId,
      wasteType: row.wasteType,
      weekday: row.weekday,
      shift: row.shift,
      note: row.note,
    }))
  }

  private query() {
    return ScheduleModel.query({ client: this.transaction.client() })
  }

  private joined() {
    return this.query()
      .join(
        'neighborhoods',
        'neighborhoods.id',
        'collection_schedules.neighborhood_id',
      )
      .select('collection_schedules.*')
      .select('neighborhoods.name as neighborhood_name')
  }

  private toEntity(row: ScheduleModel): CollectionSchedule {
    return CollectionSchedule.restore({
      id: row.id,
      neighborhoodId: row.neighborhoodId,
      wasteType: row.wasteType,
      weekday: row.weekday,
      shift: row.shift,
      note: row.note,
      createdAt: row.createdAt.toJSDate(),
      updatedAt: row.updatedAt?.toJSDate() ?? null,
    })
  }

  private toResponse(row: ScheduleModel): ManagementScheduleShowResponse {
    return {
      id: row.id,
      neighborhoodId: row.neighborhoodId,
      neighborhoodName: String(row.$extras['neighborhood_name']),
      wasteType: row.wasteType,
      weekday: row.weekday,
      shift: row.shift,
      note: row.note,
      createdAt: row.createdAt.toISO() ?? '',
      updatedAt: row.updatedAt?.toISO() ?? null,
    }
  }

  private dateOrNull(date: Date | null): DateTime | null {
    if (!date) return null

    return DateTime.fromJSDate(date)
  }
}
