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

import { MemoryPagination } from '#core/memory-pagination'
import {
  CollectionSchedule,
  type CollectionScheduleProps,
} from '#domain/collection-schedule/collection-schedule.entity'
import type { CollectionScheduleError } from '#domain/collection-schedule/collection-schedule.errors'

function sameSlot(a: ScheduleSlot, b: ScheduleSlot): boolean {
  return (
    a.neighborhoodId === b.neighborhoodId &&
    a.wasteType === b.wasteType &&
    a.weekday === b.weekday &&
    a.shift === b.shift
  )
}

/** The second real implementation, for the use case unit test (`_standards/domain.md` §5.3). */
export class CollectionScheduleMemoryRepository extends CollectionScheduleRepository {
  private readonly rows = new Map<string, CollectionScheduleProps>()
  private readonly names = new Map<string, string>()

  /** Test arrangement: the name the join would bring for a neighborhood. */
  withNeighborhood(id: string, name: string): this {
    this.names.set(id, name)
    return this
  }

  async findById(id: string): Promise<CollectionSchedule | null> {
    const props = this.rows.get(id)
    if (!props) return null

    return CollectionSchedule.restore(structuredClone(props))
  }

  async existsSlot(slot: ScheduleSlot, exceptId?: string): Promise<boolean> {
    return [...this.rows.values()].some((row) => row.id !== exceptId && sameSlot(row, slot))
  }

  async save(schedule: CollectionSchedule): Promise<Either<CollectionScheduleError, void>> {
    const snapshot = structuredClone(schedule.snapshot())
    const taken = [...this.rows.values()].some(
      (row) => row.id !== snapshot.id && sameSlot(row, snapshot),
    )
    // The slot `unique`, as the database guarantees it.
    if (taken) return left({ code: 'SCHEDULE_ALREADY_EXISTS' })

    this.rows.set(snapshot.id, snapshot)

    return right(undefined)
  }

  async delete(schedule: CollectionSchedule): Promise<void> {
    this.rows.delete(schedule.id)
  }

  async detail(id: string): Promise<ManagementScheduleShowResponse | null> {
    const row = this.rows.get(id)
    if (!row) return null

    return this.toResponse(row)
  }

  async paginate(
    criteria: ScheduleListCriteria,
  ): Promise<Paginated<ManagementScheduleShowResponse>> {
    const all = [...this.rows.values()].filter(
      (row) => !criteria.neighborhoodId || row.neighborhoodId === criteria.neighborhoodId,
    )
    const page = MemoryPagination.slice(all, criteria.page, criteria.perPage)

    return { meta: page.meta, data: page.data.map((row) => this.toResponse(row)) }
  }

  async listWeek(neighborhoodId?: string): Promise<StorefrontScheduleShowResponse[]> {
    return [...this.rows.values()]
      .filter((row) => !neighborhoodId || row.neighborhoodId === neighborhoodId)
      .sort(
        (a, b) =>
          WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) ||
          COLLECTION_SHIFTS.indexOf(a.shift) - COLLECTION_SHIFTS.indexOf(b.shift),
      )
      .map((row) => ({
        id: row.id,
        neighborhoodId: row.neighborhoodId,
        wasteType: row.wasteType,
        weekday: row.weekday,
        shift: row.shift,
        note: row.note,
      }))
  }

  private toResponse(row: CollectionScheduleProps): ManagementScheduleShowResponse {
    return {
      id: row.id,
      neighborhoodId: row.neighborhoodId,
      neighborhoodName: this.names.get(row.neighborhoodId) ?? '',
      wasteType: row.wasteType,
      weekday: row.weekday,
      shift: row.shift,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt?.toISOString() ?? null,
    }
  }
}
