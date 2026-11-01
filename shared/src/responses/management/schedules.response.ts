import { COLLECTION_SHIFTS } from '../../enums/collection-shift.js'
import { WASTE_TYPES } from '../../enums/waste-type.js'
import { WEEKDAYS } from '../../enums/weekday.js'
import { z } from '../../validator.js'

export const ManagementScheduleShowResponse = z.object({
  id: z.uuid(),
  neighborhoodId: z.uuid(),
  neighborhoodName: z.string(),
  wasteType: z.enum(WASTE_TYPES),
  weekday: z.enum(WEEKDAYS),
  shift: z.enum(COLLECTION_SHIFTS),
  note: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type ManagementScheduleShowResponse = z.infer<
  typeof ManagementScheduleShowResponse
>
