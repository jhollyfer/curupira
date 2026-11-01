import { NEIGHBORHOOD_SORT_COLUMNS } from '@curupira/shared'

import { vine, notNull, paginationFields, sortFields } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A neighborhood and its optional center. Mirror (path and name) of the Zod one in
 * `shared/src/validators/management/neighborhoods.validator.ts`.
 *
 * The center is what lets a report with no neighborhood picked be matched to the nearest
 * one (`NeighborhoodRepository.nearestTo`); `null` erases it on update.
 */
function latitude() {
  return vine.number().min(-90).max(90)
}

function longitude() {
  return vine.number().min(-180).max(180)
}

export const ManagementNeighborhoodCreateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(80),
  latitude: latitude().nullable().optional(),
  longitude: longitude().nullable().optional(),
})

export const ManagementNeighborhoodUpdateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(80).optional().use(notNull()),
  latitude: latitude().nullable().optional(),
  longitude: longitude().nullable().optional(),
})

export const ManagementNeighborhoodPaginateValidator = vine.create({
  ...paginationFields(),
  ...sortFields(NEIGHBORHOOD_SORT_COLUMNS),
})

export type ManagementNeighborhoodCreatePayload = Infer<
  typeof ManagementNeighborhoodCreateValidator
>

export type ManagementNeighborhoodUpdatePayload = Infer<
  typeof ManagementNeighborhoodUpdateValidator
>

export type ManagementNeighborhoodPaginatePayload = Infer<
  typeof ManagementNeighborhoodPaginateValidator
>
