import { NOTICE_SORT_COLUMNS, NOTICE_STATUSES } from '@curupira/shared'

import { vine, notNull, paginationFields, sortFields } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * A notice and its showing period. Mirror (path and name) of the Zod one in
 * `shared/src/validators/management/notices.validator.ts`.
 *
 * The instants arrive as ISO 8601 with offset and stay strings: the use case turns them
 * into `Date`, so the validator does not decide the timezone. That `endsAt` is after
 * `startsAt` is a notice entity rule.
 */
function instant() {
  return vine.string().trim().maxLength(40).isoDateTime()
}

export const ManagementNoticeCreateValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(120),
  body: vine.string().trim().minLength(1).maxLength(600),
  startsAt: instant(),
  endsAt: instant().nullable().optional(),
})

export const ManagementNoticeUpdateValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(120).optional().use(notNull()),
  body: vine.string().trim().minLength(1).maxLength(600).optional().use(notNull()),
  startsAt: instant().optional().use(notNull()),
  endsAt: instant().nullable().optional(),
})

export const ManagementNoticePaginateValidator = vine.create({
  ...paginationFields(),
  status: vine.enum(NOTICE_STATUSES).optional(),
  ...sortFields(NOTICE_SORT_COLUMNS),
})

export type ManagementNoticeCreatePayload = Infer<typeof ManagementNoticeCreateValidator>

export type ManagementNoticeUpdatePayload = Infer<typeof ManagementNoticeUpdateValidator>

export type ManagementNoticePaginatePayload = Infer<typeof ManagementNoticePaginateValidator>
