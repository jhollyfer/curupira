import { COLLECTION_SHIFTS } from '../../enums/collection-shift.js'
import { WASTE_TYPES } from '../../enums/waste-type.js'
import { WEEKDAYS } from '../../enums/weekday.js'
import { z } from '../../validator.js'

/** One weekly pass of the truck; the frontend unfolds it into dates (`lib/schedule`). */
export const StorefrontScheduleShowResponse = z.object({
  id: z.uuid(),
  neighborhoodId: z.uuid(),
  wasteType: z.enum(WASTE_TYPES),
  weekday: z.enum(WEEKDAYS),
  shift: z.enum(COLLECTION_SHIFTS),
  note: z.string().nullable(),
})

export type StorefrontScheduleShowResponse = z.infer<
  typeof StorefrontScheduleShowResponse
>
