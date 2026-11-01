import { REPORT_KINDS } from '../../enums/report-kind.js'
import { LIST_LIMITS, z } from '../../validator.js'
import { normalizeProtocol, PROTOCOL_PATTERN } from '../../value-objects/protocol.js'

/**
 * The public report. Mirror (path and name) of the VineJS one in
 * `backend/app/validators/storefront/reports.validator.ts`
 * (`_standards/architecture.md` §10).
 *
 * Anonymous by default: `contact` absent means the resident left nothing, and the
 * server stores nothing about who sent it. The photos arrive as ids of the files
 * uploaded before (`storefront/report-photos`), because the bytes do not pass through
 * the API. The coordinate is the one the resident confirmed on the map, never read
 * from the photo's EXIF.
 */
export const StorefrontReportCreateValidator = z.object({
  kind: z.enum(REPORT_KINDS),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().trim().max(LIST_LIMITS.REPORT_DESCRIPTION).optional(),
  contact: z.string().trim().min(3).max(120).optional(),
  photoIds: z.array(z.uuid()).min(1).max(LIST_LIMITS.REPORT_PHOTOS),
})

/**
 * The lookup by protocol. The input is normalized before the rule (case, spaces and
 * look-alike letters), so what the resident typed on a phone still finds the report.
 */
export const StorefrontReportShowByProtocolValidator = z.object({
  protocol: z
    .string()
    .trim()
    .max(40)
    .transform(normalizeProtocol)
    .refine((value) => PROTOCOL_PATTERN.test(value)),
})

export type StorefrontReportCreatePayload = z.infer<
  typeof StorefrontReportCreateValidator
>

export type StorefrontReportShowByProtocolPayload = z.infer<
  typeof StorefrontReportShowByProtocolValidator
>
