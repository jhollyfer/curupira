import { COLLECTION_SHIFTS } from '../../enums/collection-shift.js'
import { WASTE_TYPES } from '../../enums/waste-type.js'
import { WEEKDAYS } from '../../enums/weekday.js'
import { pageFields, z } from '../../validator.js'

/**
 * One weekly pass of the truck in a neighborhood. Mirror (path and name) of the VineJS
 * one in `backend/app/validators/management/schedules.validator.ts`. That the same
 * neighborhood does not repeat type, day and shift is an entity rule (409), not a
 * form one.
 */
export const ManagementScheduleCreateValidator = z.object({
  neighborhoodId: z.uuid(),
  wasteType: z.enum(WASTE_TYPES),
  weekday: z.enum(WEEKDAYS),
  shift: z.enum(COLLECTION_SHIFTS),
  note: z.string().trim().max(200).nullable().optional(),
})

export const ManagementScheduleUpdateValidator =
  ManagementScheduleCreateValidator.partial()

export const ManagementSchedulePaginateValidator = z.object({
  ...pageFields(),
  neighborhoodId: z.uuid().optional(),
})

export type ManagementScheduleCreatePayload = z.infer<
  typeof ManagementScheduleCreateValidator
>
export type ManagementScheduleUpdatePayload = z.infer<
  typeof ManagementScheduleUpdateValidator
>
export type ManagementSchedulePaginatePayload = z.infer<
  typeof ManagementSchedulePaginateValidator
>
