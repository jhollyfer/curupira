import { test } from '@japa/runner'

import { Semaphore } from '#core/semaphore'

test.group('Semaphore', () => {
  test('never runs more tasks at once than its limit, and runs them all', async ({
    assert,
  }) => {
    const semaphore = new Semaphore(2)
    let active = 0
    let peak = 0

    const task = async (value: number) => {
      active += 1
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active -= 1

      return value
    }

    const results = await Promise.all(
      [1, 2, 3, 4, 5, 6].map((n) => semaphore.run(() => task(n))),
    )

    assert.deepEqual(results, [1, 2, 3, 4, 5, 6])
    assert.equal(peak, 2)
  })

  test('a task that throws gives its slot back', async ({ assert }) => {
    const semaphore = new Semaphore(1)

    await assert.rejects(() =>
      semaphore.run(async () => {
        throw new Error('boom')
      }),
    )

    assert.equal(await semaphore.run(async () => 'next'), 'next')
  })

  test('refuses a limit below one', ({ assert }) => {
    assert.throws(() => new Semaphore(0))
  })
})
