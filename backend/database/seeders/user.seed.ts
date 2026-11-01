import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { ACTIVE_STATUS, USER_ROLE } from '@curupira/shared'

import env from '#start/env'
import User from '#models/user'

/**
 * The first owner (an `ADMINISTRATOR`). No endpoint creates an account without a session -
 * the panel is the only user entry door -, so without this seeder a new database would
 * have nowhere to start.
 */
export default class extends BaseSeeder {
  /**
   * Outside production: there the first owner is created by hand, and this record would
   * be just a known default credential with administrator power.
   */
  static override environment = ['development', 'test']

  override async run() {
    const email = env.get('SEED_OWNER_EMAIL') ?? 'owner@mail.com'
    const password = env.get('SEED_OWNER_PASSWORD')

    /*
     * Without a password the seeder stops, and does not invent one.
     *
     * The repository is the wrong place for a credential: whoever read a literal here
     * signed in as administrator in every environment that had run the seeder -
     * production included. A default, even a "temporary" one, goes back to being exactly that.
     *
     * Failing here is safe because the seeder runs by hand: the application starts without
     * this variable, and only whoever seeds needs it.
     */
    if (!password) {
      throw new Error(
        'SEED_OWNER_PASSWORD missing. Set a password in the environment before running the seeder: ' +
          'SEED_OWNER_PASSWORD=<password> node ace db:seed',
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
