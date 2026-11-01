import { z } from '../../validator.js'

/**
 * The schedule the resident reads, by neighborhood. Mirror (path and name) of the
 * VineJS one in `backend/app/validators/storefront/schedules.validator.ts`.
 * The listing is small (a neighborhood has a handful of weekly passes), so it has no
 * page: the whole week comes at once and the frontend keeps it for offline.
 */
export const StorefrontSchedulePaginateValidator = z.object({
  neighborhoodId: z.uuid().optional(),
})

export type StorefrontSchedulePaginatePayload = z.infer<
  typeof StorefrontSchedulePaginateValidator
>
