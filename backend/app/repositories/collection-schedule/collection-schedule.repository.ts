import type {
  CollectionShift,
  Either,
  ManagementScheduleShowResponse,
  Paginated,
  StorefrontScheduleShowResponse,
  WasteType,
  Weekday,
} from '@curupira/shared'

import type { CollectionSchedule } from '#domain/collection-schedule/collection-schedule.entity'
import type { CollectionScheduleError } from '#domain/collection-schedule/collection-schedule.errors'

export type ScheduleListCriteria = {
  readonly page: number
  readonly perPage: number
  readonly neighborhoodId?: string
}

/** The four fields that identify a slot (the database `unique`). */
export type ScheduleSlot = {
  readonly neighborhoodId: string
  readonly wasteType: WasteType
  readonly weekday: Weekday
  readonly shift: CollectionShift
}

/**
 * The collection slot persistence, by intent (`_standards/domain.md` §5.1). The single
 * writer of the `collection_schedules` table.
 */
export abstract class CollectionScheduleRepository {
  abstract findById(id: string): Promise<CollectionSchedule | null>
  /** Another slot, other than `exceptId`, is the same neighborhood + type + weekday + shift. */
  abstract existsSlot(slot: ScheduleSlot, exceptId?: string): Promise<boolean>
  /** Saves the slot; the repeated slot (the race on the `unique`) comes back as a fact. */
  abstract save(
    schedule: CollectionSchedule,
  ): Promise<Either<CollectionScheduleError, void>>
  abstract delete(schedule: CollectionSchedule): Promise<void>
  /** Lightweight read of one slot, with the neighborhood name the panel shows. */
  abstract detail(id: string): Promise<ManagementScheduleShowResponse | null>
  abstract paginate(
    criteria: ScheduleListCriteria,
  ): Promise<Paginated<ManagementScheduleShowResponse>>
  /** The whole week, with no page: a resident reads it on one screen. In week order. */
  abstract listWeek(
    neighborhoodId?: string,
  ): Promise<StorefrontScheduleShowResponse[]>
}
