import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { left, right } from '@curupira/shared'

import { UnitOfWorkLucid } from './unit-of-work.lucid.ts'

import { TransactionContext } from '#core/transaction-context'
import { resetDatabase } from '#tests/http-fixtures'

/** A write inside the unit, through the client the repositories use. */
async function insertNeighborhood(
  context: TransactionContext,
  name: string,
): Promise<void> {
  await context.client().insertQuery().table('neighborhoods').insert({
    name,
    slug: name.toLowerCase(),
    created_at: new Date(),
  })
}

test.group('UnitOfWorkLucid', (group) => {
  group.each.setup(() => resetDatabase())

  test('right commits the write', async ({ assert }) => {
    const unit = await app.container.make(UnitOfWorkLucid)
    const context = await app.container.make(TransactionContext)

    const result = await unit.run(async () => {
      await insertNeighborhood(context, 'Xadrez')
      return right(true)
    })

    assert.isTrue(result.isRight())
    assert.lengthOf(await db.from('neighborhoods').where('name', 'Xadrez'), 1)
  })

  test('left undoes the write without throw', async ({ assert }) => {
    const unit = await app.container.make(UnitOfWorkLucid)
    const context = await app.container.make(TransactionContext)

    const result = await unit.run(async () => {
      await insertNeighborhood(context, 'Damas')
      return left('RECUSADO')
    })

    assert.isTrue(result.isLeft())
    assert.lengthOf(await db.from('neighborhoods').where('name', 'Damas'), 0)
  })

  test('an exception undoes the write and rises', async ({ assert }) => {
    const unit = await app.container.make(UnitOfWorkLucid)
    const context = await app.container.make(TransactionContext)

    await assert.rejects(() =>
      unit.run(async () => {
        await insertNeighborhood(context, 'Dominó')
        throw new Error('bug')
      }),
    )
    assert.lengthOf(await db.from('neighborhoods').where('name', 'Dominó'), 0)
  })
})
