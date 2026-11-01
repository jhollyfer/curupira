import { ACTIVE_STATUSES } from '../../enums/active-status.js'
import { USER_ROLES } from '../../enums/user-role.js'
import { z } from '../../validator.js'

export const ManagementUserShowResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role: z.enum(USER_ROLES),
  status: z.enum(ACTIVE_STATUSES),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }).nullable(),
})

export type ManagementUserShowResponse = z.infer<
  typeof ManagementUserShowResponse
>
