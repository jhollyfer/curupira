/**
 * What the account refuses, as a fact (`_standards/domain.md` §2): no HTTP status
 * or screen text. The use case translates each one. The codes are those of the API
 * contract, and so do not carry the entity prefix.
 */
export type UserError =
  /** The e-mail belongs to another account (the check before saving and the race on the `unique`). */
  | { readonly code: 'USER_ALREADY_EXISTS' }
  /** The current password given does not match the stored one. */
  | { readonly code: 'CURRENT_PASSWORD_INVALID' }
  | { readonly code: 'PASSWORD_SAME_AS_CURRENT' }
