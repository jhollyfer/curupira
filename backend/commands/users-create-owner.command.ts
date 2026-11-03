import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/** The owner's display name: the account can rename itself in the panel afterwards. */
const OWNER_NAME = 'Gestão Curupira'

/**
 * Creates the first administrator of a database that has none.
 *
 * Why a command and not only the seeder: `database/seeders/user.seed.ts` is switched on
 * by `SEED_OWNER_PASSWORD` having a value, and in production that key is normally left
 * empty (a seeded credential lives in the environment of every deploy that ran it). No
 * endpoint creates an account without a session, so a fresh production database would have
 * nobody who can sign in. This command is the deliberate, by-hand path: it reads the credentials from the operator, never from the
 * code, and does nothing once an active administrator exists, so running it twice (or on
 * every deploy) cannot add a second owner or reset a password.
 *
 * E-mail and password come from `--email` / `--password`, or from `SEED_OWNER_EMAIL` /
 * `SEED_OWNER_PASSWORD`. Prefer the environment: a flag lands in the shell history and in
 * the process list. The password goes through the same strength rule as the panel's own
 * user creation (`ManagementUserCreateValidator`), so the owner cannot start with a weaker
 * password than anyone else.
 */
export default class UsersCreateOwner extends BaseCommand {
  static override commandName = 'users:create-owner'
  static override description =
    'Creates the first administrator when none is active; does nothing otherwise'

  static override options: CommandOptions = { startApp: true }

  @flags.string({ description: 'The owner e-mail (default: SEED_OWNER_EMAIL)' })
  declare email: string

  @flags.string({
    description:
      'The owner password (default: SEED_OWNER_PASSWORD; prefer the environment)',
  })
  declare password: string

  override async run() {
    const { default: User } = await import('#models/user')
    const { default: env } = await import('#start/env')
    const { vineErrors } = await import('#core/validator')
    const { ManagementUserCreateValidator } =
      await import('#validators/management/users.validator')
    const { ACTIVE_STATUS, USER_ROLE } = await import('@curupira/shared')

    const existing = await User.query()
      .where('role', USER_ROLE.ADMINISTRATOR)
      .where('status', ACTIVE_STATUS.ACTIVE)
      .first()

    if (existing) {
      this.logger.info(
        'An active administrator already exists. Nothing was created.',
      )
      return
    }

    const email = this.email ?? env.get('SEED_OWNER_EMAIL')
    const password = this.password ?? env.get('SEED_OWNER_PASSWORD')

    if (!email || !password) {
      this.logger.error(
        'Pass --email and --password, or set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD.',
      )
      this.exitCode = 1
      return
    }

    try {
      const owner = await ManagementUserCreateValidator.validate({
        name: OWNER_NAME,
        email,
        password,
        passwordConfirmation: password,
        role: USER_ROLE.ADMINISTRATOR,
      })

      // The model hashes `password` before saving; never write a hash by hand here.
      await User.create({ ...owner, status: ACTIVE_STATUS.ACTIVE })
    } catch (error) {
      if (!(error instanceof vineErrors.E_VALIDATION_ERROR)) throw error

      for (const issue of error.messages) {
        this.logger.error(`${issue.field}: ${issue.message}`)
      }
      this.exitCode = 1
      return
    }

    this.logger.success(`Administrator ${email} created.`)
  }
}
