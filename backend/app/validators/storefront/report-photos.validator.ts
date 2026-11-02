import { LIST_LIMITS, REPORT_PHOTO_MIMETYPES } from '@curupira/shared'

import { vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * The per-photo ceiling, in bytes (`LIST_LIMITS.REPORT_PHOTO_SIZE` in `@curupira/shared`): an
 * anonymous route must not inherit the panel library's gigabyte ceiling. Refused **before**
 * any signature, so a photo over the limit never gets a URL and never reaches the bucket.
 */
export const REPORT_PHOTO_MAX_SIZE = LIST_LIMITS.REPORT_PHOTO_SIZE

/**
 * What `POST /storefront/report-photos` receives: metadata, never bytes. Mirror (path and
 * name) of the Zod one in `shared/src/validators/storefront/report-photos.validator.ts`.
 * That the declared type and size are true is what `complete` checks against the real object.
 */
export const StorefrontReportPhotoCreateValidator = vine.create({
  mimetype: vine.enum(REPORT_PHOTO_MIMETYPES),
  size: vine.number().min(1).max(REPORT_PHOTO_MAX_SIZE).withoutDecimals(),
})

export type StorefrontReportPhotoCreatePayload = Infer<typeof StorefrontReportPhotoCreateValidator>
