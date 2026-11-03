import {
  LIST_LIMITS,
  REPORT_KINDS,
  REPORT_SORT_COLUMNS,
  REPORT_STATUSES,
} from '@curupira/shared'

import { vine, isoInstant, paginationFields, sortFields } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * The report filters of the panel, in one place for the list and the map: both screens
 * cut by the same fields, so a filter added to one cannot be forgotten on the other.
 * Mirror (path and name) of the Zod one in
 * `shared/src/validators/management/reports.validator.ts`.
 */
function reportFilterFields() {
  return {
    kind: vine.enum(REPORT_KINDS).optional(),
    status: vine.enum(REPORT_STATUSES).optional(),
    neighborhoodId: vine.string().uuid().optional(),
    from: isoInstant().optional(),
    to: isoInstant().optional(),
  }
}

export const ManagementReportPaginateValidator = vine.create({
  ...paginationFields(),
  ...reportFilterFields(),
  ...sortFields(REPORT_SORT_COLUMNS),
})

export const ManagementReportMapValidator = vine.create(reportFilterFields())

export const ManagementReportUpdateStatusValidator = vine.create({
  status: vine.enum(REPORT_STATUSES),
  message: vine
    .string()
    .trim()
    .maxLength(LIST_LIMITS.REPORT_RESPONSE)
    .optional(),
})

export type ManagementReportPaginatePayload = Infer<
  typeof ManagementReportPaginateValidator
>

export type ManagementReportMapPayload = Infer<
  typeof ManagementReportMapValidator
>

export type ManagementReportUpdateStatusPayload = Infer<
  typeof ManagementReportUpdateStatusValidator
>
