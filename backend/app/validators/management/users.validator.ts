import { USER_ROLES, USER_SORT_COLUMNS } from '@curupira/shared'

import {
  vine,
  notNull,
  email,
  password,
  activeStatus,
  paginationFields,
  sortFields,
} from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `POST /management/users` receives. Mirror (path and name) of the Zod one in
 * `shared/src/validators/management/users.validator.ts`.
 *
 * `role` is **required**: the column has no `DEFAULT`, and the role is always explicit.
 * A creation path that fell back to `ADMINISTRATOR` by omission would silently write the
 * most powerful role.
 *
 * `password` goes through the shared strength rule, which also requires
 * `passwordConfirmation` with the same value - the field is read from the raw input and
 * does not enter the validated payload.
 */
export const ManagementUserCreateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  email: email(),
  password: password(),
  role: vine.enum(USER_ROLES),
})

/**
 * What `PUT /management/users/:id` receives. **Every field is optional**: an absent field
 * means "leave alone", not "erase".
 */
export const ManagementUserUpdateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120).optional().use(notNull()),
  email: email().optional().use(notNull()),
  password: password().optional().use(notNull()),
  role: vine.enum(USER_ROLES).optional().use(notNull()),
  status: activeStatus().optional().use(notNull()),
})

export const ManagementUserPaginateValidator = vine.create({
  ...paginationFields(),
  ...sortFields(USER_SORT_COLUMNS),
  role: vine.enum(USER_ROLES).optional(),
  status: activeStatus().optional(),
})

export type ManagementUserCreatePayload = Infer<typeof ManagementUserCreateValidator>

export type ManagementUserUpdatePayload = Infer<typeof ManagementUserUpdateValidator>

export type ManagementUserPaginatePayload = Infer<typeof ManagementUserPaginateValidator>
