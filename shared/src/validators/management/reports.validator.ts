import { REPORT_KINDS } from '../../enums/report-kind.js'
import { REPORT_STATUSES } from '../../enums/report-status.js'
import {
  LIST_LIMITS,
  paginationFields,
  sortFields,
  z,
} from '../../validator.js'

/**
 * The reports the panel handles. Mirror (path and name) of the VineJS one in
 * `backend/app/validators/management/reports.validator.ts`.
 */
export const REPORT_SORT_COLUMNS = ['createdAt', 'status', 'kind'] as const

const instant = () => z.iso.datetime({ offset: true })

/** The filters of the table and of the map: the same ones, so both show the same set. */
export function reportFilterFields() {
  return {
    kind: z.enum(REPORT_KINDS).optional(),
    status: z.enum(REPORT_STATUSES).optional(),
    neighborhoodId: z.uuid().optional(),
    from: instant().optional(),
    to: instant().optional(),
  }
}

export const ManagementReportPaginateValidator = z.object({
  ...paginationFields(),
  ...reportFilterFields(),
  ...sortFields(REPORT_SORT_COLUMNS),
})

export const ManagementReportMapValidator = z.object(reportFilterFields())

/**
 * Moving the report to a status, with the reply the resident reads on the timeline.
 * That the status only moves forward is an entity rule (422), not a form one.
 */
export const ManagementReportUpdateStatusValidator = z.object({
  status: z.enum(REPORT_STATUSES),
  message: z.string().trim().max(LIST_LIMITS.REPORT_RESPONSE).optional(),
})

export type ManagementReportPaginatePayload = z.infer<
  typeof ManagementReportPaginateValidator
>
export type ManagementReportMapPayload = z.infer<
  typeof ManagementReportMapValidator
>
export type ManagementReportUpdateStatusPayload = z.infer<
  typeof ManagementReportUpdateStatusValidator
>
