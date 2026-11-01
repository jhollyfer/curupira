import { NOTICE_STATUSES } from '../../enums/notice-status.js'
import { z } from '../../validator.js'

export const ManagementNoticeShowResponse = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  status: z.enum(NOTICE_STATUSES),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullable(),
  closedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type ManagementNoticeShowResponse = z.infer<
  typeof ManagementNoticeShowResponse
>
