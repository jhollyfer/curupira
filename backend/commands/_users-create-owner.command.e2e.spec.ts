import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'

import UsersCreateOwner from '#commands/users-create-owner.command'
import { resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const EMAIL = 'dono@prefeitura.test'
const STRONG = 'Senha#Forte1'

/**
 * The first administrator in production. The seeder only runs in `development` and `test`
 * (a seeded credential in production would be a known administrator), so without this
 * command a fresh production database has nobody who can sign in.
 */
test.group('users > create-owner', (group) => {
  group.each.setup(async () => {
    const teardown = await resetDatabase()
    // The test seeder already created an owner; this command's whole point is the empty database.
    await Stored.removeAllUsers()

    return teardown
  })

  async function createOwner(...args: Array<string>) {
    const ace = await app.container.make('ace')
    const command = await ace.create(UsersCreateOwner, args)

    await command.exec()

    return command
  }

  test('creates the administrator with a hashed password that signs in', async ({
    assert,
  }) => {
    const command = await createOwner(
      `--email=${EMAIL}`,
      `--password=${STRONG}`,
    )

    command.assertSucceeded()
    const user = await Stored.userByEmailOrFail(EMAIL)
    assert.equal(user.role, 'ADMINISTRATOR')
    assert.equal(user.status, 'ACTIVE')
    assert.notEqual(user.password, STRONG)
    await Stored.verifyCredentials(EMAIL, STRONG)
  })

  test('is idempotent: with an active administrator already there it creates nothing', async ({
    assert,
  }) => {
    await createOwner(`--email=${EMAIL}`, `--password=${STRONG}`)

    const again = await createOwner(
      '--email=outro@prefeitura.test',
      `--password=${STRONG}`,
    )

    again.assertSucceeded()
    assert.isNull(await Stored.userByEmail('outro@prefeitura.test'))
  })

  test('a weak password is refused and nobody is created', async ({
    assert,
  }) => {
    const command = await createOwner(`--email=${EMAIL}`, '--password=12345678')

    command.assertFailed()
    assert.isNull(await Stored.userByEmail(EMAIL))
  })

  test('an invalid e-mail is refused', async ({ assert }) => {
    const command = await createOwner(
      '--email=nao-e-email',
      `--password=${STRONG}`,
    )

    command.assertFailed()
    assert.lengthOf(await Stored.users(), 0)
  })

  test('without flags it reads SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD', async ({
    assert,
  }) => {
    const command = await createOwner()

    command.assertSucceeded()
    assert.isNotNull(await Stored.userByEmail('owner@mail.com'))
  })
})
