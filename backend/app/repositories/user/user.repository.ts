import type {
  ActiveStatus,
  Either,
  ManagementUserShowResponse,
  Paginated,
  SortDirection,
  UserRole,
} from '@curupira/shared'

import type { User } from '#domain/user/user.entity'
import type { UserError } from '#domain/user/user.errors'

/** The account in the response shape: no password, no avatar (the panel does not show it). */
export type UserRead = ManagementUserShowResponse

export type UserListCriteria = {
  readonly page: number
  readonly perPage: number
  readonly search?: string
  readonly role?: UserRole
  readonly status?: ActiveStatus
  readonly sort: 'name' | 'email' | 'createdAt'
  readonly direction: SortDirection
}

/**
 * The account persistence, by intent (`_standards/domain.md` §5.1). The
 * single writer of the `users` table.
 *
 * The password enters in plain text on `save` and comes back hashed on reads: hashing is
 * persistence mechanics, not an account rule.
 */
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>
  /** The e-mail `unique` holds for the whole table. */
  abstract findByEmail(email: string): Promise<User | null>
  /** Another account, other than `exceptId`, already uses the e-mail. */
  abstract existsByEmail(email: string, exceptId?: string): Promise<boolean>
  /** Saves the account; the e-mail of another account (the race on the `unique`) comes back as `USER_ALREADY_EXISTS`. */
  abstract save(user: User): Promise<Either<UserError, void>>
  abstract delete(user: User): Promise<void>
  /** Lightweight read: the response shape, without the password. */
  abstract detail(id: string): Promise<UserRead | null>
  abstract paginate(criteria: UserListCriteria): Promise<Paginated<UserRead>>
}
