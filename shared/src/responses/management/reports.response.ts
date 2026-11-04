import { REPORT_KINDS } from '../../enums/report-kind.js'
import { REPORT_STATUSES } from '../../enums/report-status.js'
import { z } from '../../validator.js'

const instant = () => z.iso.datetime({ offset: true })

/** A row of the table and a pin of the panel map. */
export const ManagementReportListItemResponse = z.object({
  id: z.uuid(),
  protocol: z.string(),
  kind: z.enum(REPORT_KINDS),
  status: z.enum(REPORT_STATUSES),
  latitude: z.number(),
  longitude: z.number(),
  neighborhoodId: z.uuid().nullable(),
  neighborhoodName: z.string().nullable(),
  createdAt: instant(),
})

/**
 * The detail, with what only the panel sees: the contact (when the resident left one),
 * the description, the photos and the history with each reply.
 */
export const ManagementReportShowResponse = z.object({
  ...ManagementReportListItemResponse.shape,
  description: z.string().nullable(),
  contact: z.string().nullable(),
  photos: z.array(z.object({ id: z.uuid(), url: z.string() })),
  events: z.array(
    z.object({
      status: z.enum(REPORT_STATUSES),
      message: z.string().nullable(),
      authorName: z.string().nullable(),
      at: instant(),
    }),
  ),
  updatedAt: instant().nullable(),
})

/**
 * The overview: counters by kind and by status, the last 30 days day by day, and the
 * PRD's success metric (docs/PRD.md §7): of the reports of those 30 days whose 7-day
 * deadline has passed or that were already answered in time, how many got a first
 * answer from the team within 7 days. `due` zero means there is nothing to measure yet.
 */
export const ManagementReportStatsResponse = z.object({
  total: z.number().int(),
  byKind: z.record(z.enum(REPORT_KINDS), z.number().int()),
  byStatus: z.record(z.enum(REPORT_STATUSES), z.number().int()),
  lastThirtyDays: z.array(
    z.object({ day: z.iso.date(), total: z.number().int() }),
  ),
  responseWithinSevenDays: z.object({
    answered: z.number().int(),
    due: z.number().int(),
  }),
})

export type ManagementReportListItemResponse = z.infer<
  typeof ManagementReportListItemResponse
>
export type ManagementReportShowResponse = z.infer<
  typeof ManagementReportShowResponse
>
export type ManagementReportStatsResponse = z.infer<
  typeof ManagementReportStatsResponse
>
