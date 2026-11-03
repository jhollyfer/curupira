import { LIST_LIMITS, REPORT_KINDS, normalizeProtocol } from '@curupira/shared'

import { vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What the resident sends. Mirror (path and name) of the Zod one in
 * `shared/src/validators/storefront/reports.validator.ts`.
 *
 * The coordinates come from the form (GPS or the pin the resident dragged), never from the
 * photo: the EXIF is stripped on `complete`, and trusting it would hand a stranger's
 * location to the map. `contact` is optional and its absence is what makes the report
 * anonymous - the server derives it, the client does not declare it.
 */
export const StorefrontReportCreateValidator = vine.create({
  kind: vine.enum(REPORT_KINDS),
  latitude: vine.number().min(-90).max(90),
  longitude: vine.number().min(-180).max(180),
  description: vine
    .string()
    .trim()
    .maxLength(LIST_LIMITS.REPORT_DESCRIPTION)
    .optional(),
  contact: vine.string().trim().minLength(3).maxLength(120).optional(),
  photoIds: vine
    .array(vine.string().uuid())
    .minLength(1)
    .maxLength(LIST_LIMITS.REPORT_PHOTOS)
    .distinct(),
})

/**
 * The protocol is brought to the canonical shape by the validator itself
 * (`normalizeProtocol`): case, spaces, hyphens and look-alike letters are forgiven, and a
 * shape that still does not fit is a 422 pointing at the field. The pattern check is done
 * by the use case through the same shared function, because VineJS has no regex-after-transform.
 */
export const StorefrontReportShowByProtocolValidator = vine.create({
  protocol: vine
    .string()
    .trim()
    .maxLength(40)
    .transform((value) => normalizeProtocol(value)),
})

export type StorefrontReportCreatePayload = Infer<
  typeof StorefrontReportCreateValidator
>

export type StorefrontReportShowByProtocolPayload = Infer<
  typeof StorefrontReportShowByProtocolValidator
>
