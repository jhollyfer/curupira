import { NOTICE_SORT_COLUMNS, NOTICE_STATUSES } from '@curupira/shared'

import { vine, notNull, isoInstant, paginationFields, sortFields } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A notice and its showing period. Mirror (path and name) of the Zod one in
 * `shared/src/validators/management/notices.validator.ts`.
 *
 * The instants arrive as ISO 8601 with offset and stay strings: the use case turns them
 * into `Date`, so the validator does not decide the timezone. That `endsAt` is after
 * `startsAt` is a notice entity rule.
 */
export const ManagementNoticeCreateValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(120),
  body: vine.string().trim().minLength(1).maxLength(600),
  startsAt: isoInstant(),
  endsAt: isoInstant().nullable().optional(),
})

export const ManagementNoticeUpdateValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(120).optional().use(notNull()),
  body: vine.string().trim().minLength(1).maxLength(600).optional().use(notNull()),
  startsAt: isoInstant().optional().use(notNull()),
  endsAt: isoInstant().nullable().optional(),
})

export const ManagementNoticePaginateValidator = vine.create({
  ...paginationFields(),
  status: vine.enum(NOTICE_STATUSES).optional(),
  ...sortFields(NOTICE_SORT_COLUMNS),
})

export type ManagementNoticeCreatePayload = Infer<typeof ManagementNoticeCreateValidator>

export type ManagementNoticeUpdatePayload = Infer<typeof ManagementNoticeUpdateValidator>

export type ManagementNoticePaginatePayload = Infer<typeof ManagementNoticePaginateValidator>
