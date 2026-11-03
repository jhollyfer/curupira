import { COLLECTION_SHIFTS, WASTE_TYPES, WEEKDAYS } from '@curupira/shared'

import { vine, notNull, pageFields } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A collection slot of a neighborhood. Mirror (path and name) of the Zod one in
 * `shared/src/validators/management/schedules.validator.ts`.
 */
export const ManagementScheduleCreateValidator = vine.create({
  neighborhoodId: vine.string().uuid(),
  wasteType: vine.enum(WASTE_TYPES),
  weekday: vine.enum(WEEKDAYS),
  shift: vine.enum(COLLECTION_SHIFTS),
  note: vine.string().trim().maxLength(200).nullable().optional(),
})

export const ManagementScheduleUpdateValidator = vine.create({
  neighborhoodId: vine.string().uuid().optional().use(notNull()),
  wasteType: vine.enum(WASTE_TYPES).optional().use(notNull()),
  weekday: vine.enum(WEEKDAYS).optional().use(notNull()),
  shift: vine.enum(COLLECTION_SHIFTS).optional().use(notNull()),
  note: vine.string().trim().maxLength(200).nullable().optional(),
})

export const ManagementSchedulePaginateValidator = vine.create({
  ...pageFields(),
  neighborhoodId: vine.string().uuid().optional(),
})

export type ManagementScheduleCreatePayload = Infer<
  typeof ManagementScheduleCreateValidator
>

export type ManagementScheduleUpdatePayload = Infer<
  typeof ManagementScheduleUpdateValidator
>

export type ManagementSchedulePaginatePayload = Infer<
  typeof ManagementSchedulePaginateValidator
>
