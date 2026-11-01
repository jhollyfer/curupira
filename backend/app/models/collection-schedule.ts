import { column } from '@adonisjs/lucid/orm'
import type { CollectionShift, WasteType, Weekday } from '@curupira/shared'

import { CollectionScheduleSchema } from '#database/schema'

/** One collection slot: a waste type, a weekday and a shift in a neighborhood. */
export default class CollectionSchedule extends CollectionScheduleSchema {
  /**
   * Redeclared only to narrow the types: `database/schema.ts` is generated from the columns
   * and delivers every enum as `string`.
   */
  @column()
  declare wasteType: WasteType

  @column()
  declare weekday: Weekday

  @column()
  declare shift: CollectionShift
}
