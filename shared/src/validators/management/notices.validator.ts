import { NOTICE_STATUSES } from '../../enums/notice-status.js'
import { paginationFields, sortFields, z } from '../../validator.js'

/**
 * The notice that shows on the resident's home. Mirror (path and name) of the VineJS
 * one in `backend/app/validators/management/notices.validator.ts`. That `endsAt` is
 * after `startsAt` is an entity rule (422), not a form one.
 */
export const NOTICE_SORT_COLUMNS = ['title', 'startsAt', 'createdAt'] as const

const instant = () => z.iso.datetime({ offset: true })

export const ManagementNoticeCreateValidator = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(600),
  startsAt: instant(),
  endsAt: instant().nullable().optional(),
})

export const ManagementNoticeUpdateValidator =
  ManagementNoticeCreateValidator.partial()

export const ManagementNoticePaginateValidator = z.object({
  ...paginationFields(),
  status: z.enum(NOTICE_STATUSES).optional(),
  ...sortFields(NOTICE_SORT_COLUMNS),
})

export type ManagementNoticeCreatePayload = z.infer<
  typeof ManagementNoticeCreateValidator
>
export type ManagementNoticeUpdatePayload = z.infer<
  typeof ManagementNoticeUpdateValidator
>
export type ManagementNoticePaginatePayload = z.infer<
  typeof ManagementNoticePaginateValidator
>
