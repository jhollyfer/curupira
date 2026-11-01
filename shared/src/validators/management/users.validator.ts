import { ACTIVE_STATUSES } from '../../enums/active-status.js'
import { USER_ROLES } from '../../enums/user-role.js'
import {
  emailField,
  paginationFields,
  passwordField,
  sortFields,
  z,
} from '../../validator.js'

/**
 * The management accounts. Mirror (path and name) of the VineJS one in
 * `backend/app/validators/management/users.validator.ts`.
 */
export const USER_SORT_COLUMNS = ['name', 'email', 'createdAt'] as const

export const ManagementUserCreateValidator = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailField(),
  password: passwordField(),
  role: z.enum(USER_ROLES),
})

export const ManagementUserUpdateValidator = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: emailField().optional(),
  password: passwordField().optional(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(ACTIVE_STATUSES).optional(),
})

export const ManagementUserPaginateValidator = z.object({
  ...paginationFields(),
  role: z.enum(USER_ROLES).optional(),
  status: z.enum(ACTIVE_STATUSES).optional(),
  ...sortFields(USER_SORT_COLUMNS),
})

export type ManagementUserCreatePayload = z.infer<
  typeof ManagementUserCreateValidator
>
export type ManagementUserUpdatePayload = z.infer<
  typeof ManagementUserUpdateValidator
>
export type ManagementUserPaginatePayload = z.infer<
  typeof ManagementUserPaginateValidator
>
