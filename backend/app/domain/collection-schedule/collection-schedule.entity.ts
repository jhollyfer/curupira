import type { CollectionShift, WasteType, Weekday } from '@curupira/shared'

export type CollectionScheduleProps = {
  readonly id: string
  neighborhoodId: string
  wasteType: WasteType
  weekday: Weekday
  shift: CollectionShift
  note: string | null
  readonly createdAt: Date
  updatedAt: Date | null
}

type CollectionScheduleChanges = {
  readonly neighborhoodId?: string
  readonly wasteType?: WasteType
  readonly weekday?: Weekday
  readonly shift?: CollectionShift
  readonly note?: string | null
}

/**
 * One collection slot: a waste type passes in a neighborhood on a weekday, in a shift
 * (`_standards/domain.md` §1). The weekly repetition is the whole model - there are no
 * dates - because the truck follows the week, not the calendar.
 */
export class CollectionSchedule {
  private constructor(private readonly props: CollectionScheduleProps) {}

  static create(input: {
    readonly id: string
    readonly neighborhoodId: string
    readonly wasteType: WasteType
    readonly weekday: Weekday
    readonly shift: CollectionShift
    readonly note?: string | null
    readonly now: Date
  }): CollectionSchedule {
    return new CollectionSchedule({
      id: input.id,
      neighborhoodId: input.neighborhoodId,
      wasteType: input.wasteType,
      weekday: input.weekday,
      shift: input.shift,
      note: input.note ?? null,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  static restore(props: CollectionScheduleProps): CollectionSchedule {
    return new CollectionSchedule({ ...props })
  }

  /** Absent field means "leave alone"; `null` on `note` erases it. */
  update(changes: CollectionScheduleChanges, now: Date): CollectionSchedule {
    if (changes.neighborhoodId !== undefined)
      this.props.neighborhoodId = changes.neighborhoodId
    if (changes.wasteType !== undefined)
      this.props.wasteType = changes.wasteType
    if (changes.weekday !== undefined) this.props.weekday = changes.weekday
    if (changes.shift !== undefined) this.props.shift = changes.shift
    if (changes.note !== undefined) this.props.note = changes.note
    this.props.updatedAt = now

    return this
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<CollectionScheduleProps> {
    return { ...this.props }
  }
}
