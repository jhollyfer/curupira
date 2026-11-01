import { paginationFields, sortFields, z } from '../../validator.js'

/**
 * The neighborhood, as the panel registers it. Mirror (path and name) of the VineJS
 * one in `backend/app/validators/management/neighborhoods.validator.ts`.
 */
export const NEIGHBORHOOD_SORT_COLUMNS = ['name', 'createdAt'] as const

export const ManagementNeighborhoodCreateValidator = z.object({
  name: z.string().trim().min(1).max(80),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
})

export const ManagementNeighborhoodUpdateValidator =
  ManagementNeighborhoodCreateValidator.partial()

export const ManagementNeighborhoodPaginateValidator = z.object({
  ...paginationFields(),
  ...sortFields(NEIGHBORHOOD_SORT_COLUMNS),
})

export type ManagementNeighborhoodCreatePayload = z.infer<
  typeof ManagementNeighborhoodCreateValidator
>
export type ManagementNeighborhoodUpdatePayload = z.infer<
  typeof ManagementNeighborhoodUpdateValidator
>
export type ManagementNeighborhoodPaginatePayload = z.infer<
  typeof ManagementNeighborhoodPaginateValidator
>
