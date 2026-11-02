import { BaseSeeder } from '@adonisjs/lucid/seeders'
import logger from '@adonisjs/core/services/logger'
import { ACTIVE_STATUS, USER_ROLE } from '@curupira/shared'

import env from '#start/env'
import User from '#models/user'

/**
 * The first owner (an `ADMINISTRATOR`). No endpoint creates an account without a session -
 * the panel is the only user entry door -, so without this seeder a new database would
 * have nowhere to start.
 *
 * Switched on by `SEED_OWNER_PASSWORD` having a value, in any environment
 * (_standards/backend.md §6.2, "Seed ligado pela chave"): no `static environment` and no
 * `NODE_ENV`. The password is the operator's, never the code's.
 */
export default class extends BaseSeeder {
  override async run() {
    const email = env.get('SEED_OWNER_EMAIL')
    const password = env.get('SEED_OWNER_PASSWORD')

    /*
     * Without a password the seeder skips, and does not invent one.
     *
     * The repository is the wrong place for a credential: whoever read a literal here
     * signed in as administrator in every environment that had run the seeder -
     * production included. A default, even a "temporary" one, goes back to being exactly that.
     * Skipping (not throwing) keeps the rest of `node ace db:seed` running.
     */
    if (!password) {
      logger.info('SEED_OWNER_PASSWORD is empty: the owner seed was skipped.')
      return
    }

    // The pair goes together: a password with no e-mail has nobody to belong to.
    if (!email) {
      throw new Error(
        'SEED_OWNER_EMAIL missing. SEED_OWNER_PASSWORD and SEED_OWNER_EMAIL go together.',
      )
    }

    // `updateOrCreate(searchPayload, savePayload)`: the first argument is only the search
    // key. Passing `password` in it would never match, because the column stores the hash.
    // `status` goes in the `savePayload` even though it has a default in the database:
    // running the seeder is the recovery path when someone deactivates the last owner
    // through the panel.
    await User.updateOrCreate(
      { email },
      {
        name: 'Gestão Curupira',
        email,
        password,
        role: USER_ROLE.ADMINISTRATOR,
        status: ACTIVE_STATUS.ACTIVE,
      },
    )
  }
}
