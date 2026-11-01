import { z } from '../../validator.js'

/** A notice showing now, as the home reads it. */
export const StorefrontNoticeShowResponse = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullable(),
})

export type StorefrontNoticeShowResponse = z.infer<
  typeof StorefrontNoticeShowResponse
>
