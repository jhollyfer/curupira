import { REPORT_KINDS } from '../../enums/report-kind.js'
import { REPORT_STATUSES } from '../../enums/report-status.js'
import { z } from '../../validator.js'

/**
 * What the resident gets back on sending: only the protocol. Nothing else about the
 * report returns, so a stolen response reveals no more than the code the sender
 * already held.
 */
export const StorefrontReportCreateResponse = z.object({
  protocol: z.string(),
})

/**
 * The status page by protocol. Never the contact, the description or the photos: the
 * code is a bearer key, and what it opens is the progress and the reply, not the
 * content of the report.
 */
export const StorefrontReportShowByProtocolResponse = z.object({
  protocol: z.string(),
  kind: z.enum(REPORT_KINDS),
  status: z.enum(REPORT_STATUSES),
  createdAt: z.iso.datetime({ offset: true }),
  events: z.array(
    z.object({
      status: z.enum(REPORT_STATUSES),
      message: z.string().nullable(),
      at: z.iso.datetime({ offset: true }),
    }),
  ),
})

/**
 * A pin of the public map: kind, status and place. No protocol, no description, no
 * photo, no contact, and no date finer than the day.
 */
export const StorefrontReportMapResponse = z.object({
  id: z.uuid(),
  kind: z.enum(REPORT_KINDS),
  status: z.enum(REPORT_STATUSES),
  latitude: z.number(),
  longitude: z.number(),
  day: z.iso.date(),
})

/** What the browser needs to PUT the photo, and the id the report will reference. */
export const StorefrontReportPhotoCreateResponse = z.object({
  id: z.uuid(),
  uploadUrl: z.string(),
})

export type StorefrontReportCreateResponse = z.infer<
  typeof StorefrontReportCreateResponse
>
export type StorefrontReportShowByProtocolResponse = z.infer<
  typeof StorefrontReportShowByProtocolResponse
>
export type StorefrontReportMapResponse = z.infer<
  typeof StorefrontReportMapResponse
>
export type StorefrontReportPhotoCreateResponse = z.infer<
  typeof StorefrontReportPhotoCreateResponse
>
