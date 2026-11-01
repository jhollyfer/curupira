import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'

import { UserLucidRepository } from './user.lucid.repository.ts'
import { UserMemoryRepository } from './user.memory.repository.ts'
import type { UserRepository } from './user.repository.ts'

import { resetDatabase } from '#tests/http-fixtures'
import { User } from '#domain/user/user.entity'

type Pair = { users: UserRepository }

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<Pair> => ({
    users: await app.container.make(UserLucidRepository),
  }),
  memory: async (): Promise<Pair> => ({ users: new UserMemoryRepository() }),
} satisfies Record<string, () => Promise<Pair>>

const NOW = new Date('2026-10-29T12:00:00.000Z')
const ANA = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a91'
const BIA = '5c7a3d2f-4a3b-4d9f-8b2c-1a7e3f8d9b02'

function account(
  id: string,
  name: string,
  email: string,
  role: 'OPERATOR' | 'ADMINISTRATOR' = 'OPERATOR',
) {
  return User.create({ id, name, email, password: 'Senha@123', role, now: NOW })
}

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`UserRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save and findById return the same account, with the password hashed', async ({
      assert,
    }) => {
      const { users } = await make()
      const ana = account(ANA, 'Ana', 'ana@t.dev')

      await users.save(ana)
      const found = await users.findById(ana.id)

      assert.deepEqual({ ...found?.snapshot(), password: '' }, { ...ana.snapshot(), password: '' })
      assert.notEqual(found?.snapshot().password, 'Senha@123')
      assert.isTrue(await hash.verify(found?.snapshot().password ?? '', 'Senha@123'))
      assert.isNull(await users.findById(BIA))
    })

    test('save of an e-mail that belongs to another account returns USER_ALREADY_EXISTS', async ({
      assert,
    }) => {
      const { users } = await make()
      await users.save(account(ANA, 'Ana', 'ana@t.dev'))

      const saved = await users.save(account(BIA, 'Bia', 'ana@t.dev'))

      assert.deepEqual(saved.value, { code: 'USER_ALREADY_EXISTS' })
    })

    test('saving again without changing the password does not hash it again', async ({
      assert,
    }) => {
      const { users } = await make()
      await users.save(account(ANA, 'Ana', 'ana@t.dev'))
      const first = await users.findById(ANA)
      const stored = first?.snapshot().password ?? ''

      first?.update({ name: 'Ana Maria' }, NOW)
      if (first) await users.save(first)

      const again = await users.findById(ANA)
      assert.equal(again?.snapshot().password, stored)
      assert.equal(again?.snapshot().name, 'Ana Maria')
    })

    test('changing the password stores the new hash', async ({ assert }) => {
      const { users } = await make()
      await users.save(account(ANA, 'Ana', 'ana@t.dev'))
      const ana = await users.findById(ANA)

      ana?.update({ password: 'Nova@12345' }, NOW)
      if (ana) await users.save(ana)

      const changed = await users.findById(ANA)
      const stored = changed?.snapshot().password ?? ''
      assert.isTrue(await hash.verify(stored, 'Nova@12345'))
    })

    test('findByEmail and existsByEmail see the account', async ({ assert }) => {
      const { users } = await make()
      await users.save(account(ANA, 'Ana', 'ana@t.dev'))

      assert.isNotNull(await users.findByEmail('ana@t.dev'))
      assert.isTrue(await users.existsByEmail('ana@t.dev'))
      assert.isFalse(await users.existsByEmail('ana@t.dev', ANA))
      assert.isNull(await users.findByEmail('outra@t.dev'))
    })

    test('detail brings the account without the password; unknown is null', async ({ assert }) => {
      const { users } = await make()
      await users.save(account(ANA, 'Ana', 'ana@t.dev'))

      const detail = await users.detail(ANA)

      assert.deepInclude(detail, { id: ANA, name: 'Ana', role: 'OPERATOR' })
      assert.notProperty(detail, 'password')
      assert.isNull(await users.detail(BIA))
    })

    test('paginate searches by name and e-mail and filters by role', async ({ assert }) => {
      const { users } = await make()
      await users.save(account(ANA, 'Ana', 'ana@t.dev'))
      await users.save(account(BIA, 'Bia', 'zeta@t.dev', 'ADMINISTRATOR'))
      // The seeder leaves the owner in the table: the search cuts only the test accounts.
      const base = {
        page: 1,
        perPage: 10,
        search: '@t.dev',
        sort: 'name',
        direction: 'asc',
      } as const

      const everyone = await users.paginate(base)
      const byEmail = await users.paginate({ ...base, search: 'ZETA' })
      const admins = await users.paginate({ ...base, role: 'ADMINISTRATOR' })

      assert.deepEqual(
        everyone.data.map((item) => item.name),
        ['Ana', 'Bia'],
      )
      assert.deepEqual(
        byEmail.data.map((item) => item.name),
        ['Bia'],
      )
      assert.deepEqual(
        admins.data.map((item) => item.name),
        ['Bia'],
      )
    })

    test('delete deletes for good', async ({ assert }) => {
      const { users } = await make()
      const ana = account(ANA, 'Ana', 'ana@t.dev')
      await users.save(ana)

      await users.delete(ana)

      assert.isNull(await users.findById(ANA))
    })
  })
}
