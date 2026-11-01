import {
  ACTIVE_STATUS,
  left,
  right,
  type ActiveStatus,
  type Either,
  type UserRole,
} from '@curupira/shared'

import type { UserError } from './user.errors.ts'

export type UserProps = {
  readonly id: string
  name: string
  email: string
  /**
   * The hash, once saved. Plain text only between `create`/`update` and the
   * repository's `save`: whoever hashes is persistence (model hook), not the
   * account rule.
   */
  password: string
  role: UserRole
  status: ActiveStatus
  avatarId: string | null
  readonly createdAt: Date
  updatedAt: Date | null
}

/** What `update` changes; an absent field means "leave alone", and only `avatarId` accepts `null`. */
export type UserChanges = {
  readonly name?: string
  readonly email?: string
  readonly password?: string
  readonly role?: UserRole
  readonly status?: ActiveStatus
  readonly avatarId?: string | null
}

/** What an edit obliges to do besides saving the account. */
export type UserUpdateEffects = {
  /** Access changed: live sessions are no longer valid. */
  readonly revokesSessions: boolean
}

/** What the password-change identity proof found, already checked against the hash. */
export type PasswordProof = {
  readonly currentConfirmed: boolean
  readonly sameAsCurrent: boolean
}

/**
 * The account of whoever enters the panel: role and status (`_standards/domain.md` §1).
 * Leaving the team is deleting the account; pausing it is `INACTIVE`.
 */
export class User {
  private constructor(private readonly props: UserProps) {}

  /** Birth. The id and the clock come from outside: the domain does no I/O. */
  static create(input: {
    readonly id: string
    readonly name: string
    readonly email: string
    readonly password: string
    readonly role: UserRole
    readonly status?: ActiveStatus
    readonly avatarId?: string | null
    readonly now: Date
  }): User {
    return new User({
      id: input.id,
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role,
      status: input.status ?? ACTIVE_STATUS.ACTIVE,
      avatarId: input.avatarId ?? null,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  /** Rehydration by the repository: the data passed through the rules when it was saved. */
  static restore(props: UserProps): User {
    return new User({ ...props })
  }

  /** Edit by the administrator. */
  update(changes: UserChanges, now: Date): UserUpdateEffects {
    return this.apply(changes, now)
  }

  /**
   * Edit of the account itself. Changing the password requires the current one, and the new one must be
   * different: the session proves possession of the cookie, not identity.
   */
  updateOwn(
    changes: Omit<UserChanges, 'role' | 'status'>,
    proof: PasswordProof,
    now: Date,
  ): Either<UserError, UserUpdateEffects> {
    if (changes.password) {
      if (!proof.currentConfirmed) return left({ code: 'CURRENT_PASSWORD_INVALID' })
      if (proof.sameAsCurrent) return left({ code: 'PASSWORD_SAME_AS_CURRENT' })
    }

    return right(this.apply(changes, now))
  }

  /** An active account: an inactive one gets the same refusal as someone who gets the password wrong. */
  canSignIn(): boolean {
    return this.props.status === ACTIVE_STATUS.ACTIVE
  }

  get id(): string {
    return this.props.id
  }

  snapshot(): Readonly<UserProps> {
    return { ...this.props }
  }

  /**
   * Writes only the present keys. A changed e-mail and password, a role change and
   * deactivation drop the sessions: the guard does not read `status`, and an earlier
   * token would survive the access change.
   */
  private apply(changes: UserChanges, now: Date): UserUpdateEffects {
    const emailChanged = changes.email !== undefined && changes.email !== this.props.email
    const roleChanged = changes.role !== undefined && changes.role !== this.props.role
    const deactivated = changes.status === ACTIVE_STATUS.INACTIVE

    if (changes.name !== undefined) this.props.name = changes.name
    if (changes.email !== undefined) this.props.email = changes.email
    if (changes.password !== undefined) this.props.password = changes.password
    if (changes.role !== undefined) this.props.role = changes.role
    if (changes.status !== undefined) this.props.status = changes.status
    if (changes.avatarId !== undefined) this.props.avatarId = changes.avatarId
    this.props.updatedAt = now

    return {
      revokesSessions: emailChanged || Boolean(changes.password) || roleChanged || deactivated,
    }
  }
}
