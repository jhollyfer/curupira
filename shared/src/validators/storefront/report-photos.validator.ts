import { z } from '../../validator.js'

/** The image types a report accepts: a phone photo, nothing else. */
export const REPORT_PHOTO_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

/**
 * The metadata of a report photo, never bytes. Mirror (path and name) of the VineJS
 * one in `backend/app/validators/storefront/report-photos.validator.ts`. The `size`
 * ceiling comes from the server environment and only it enforces it.
 */
export const StorefrontReportPhotoCreateValidator = z.object({
  mimetype: z.enum(REPORT_PHOTO_MIMETYPES),
  size: z.number().int().min(1),
})

export type StorefrontReportPhotoCreatePayload = z.infer<
  typeof StorefrontReportPhotoCreateValidator
>
