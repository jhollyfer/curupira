import factory from '@adonisjs/lucid/factories'
import { COLLECTION_SHIFT, WASTE_TYPE, WEEKDAY } from '@curupira/shared'

import CollectionSchedule from '#models/collection-schedule'

/**
 * A Monday morning organic collection. `neighborhoodId` has no default: a slot always
 * belongs to a neighborhood, and the test says which (`CollectionScheduleFactory.merge({ neighborhoodId })`).
 */
export const CollectionScheduleFactory = factory
  .define(CollectionSchedule, () => ({
    wasteType: WASTE_TYPE.ORGANIC,
    weekday: WEEKDAY.MONDAY,
    shift: COLLECTION_SHIFT.MORNING,
    note: null,
  }))
  .build()
