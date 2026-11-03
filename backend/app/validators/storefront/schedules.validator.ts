import { vine } from '#core/validator'
import type { Infer } from '#core/validator'

/** The week of one neighborhood, or of all. Mirror (path and name) of the Zod one in `shared/`. */
export const StorefrontSchedulePaginateValidator = vine.create({
  neighborhoodId: vine.string().uuid().optional(),
})

export type StorefrontSchedulePaginatePayload = Infer<
  typeof StorefrontSchedulePaginateValidator
>
