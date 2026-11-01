import { test } from '@japa/runner'

import { Notice } from './notice.entity.ts'

const NOW = new Date('2026-10-29T12:00:00Z')
const DAY = 24 * 60 * 60 * 1000
const at = (days: number) => new Date(NOW.getTime() + days * DAY)

function notice(startsAt = at(-1), endsAt: Date | null = null): Notice {
  const created = Notice.create({
    id: 'id',
    title: 'Aviso',
    body: 'Texto',
    startsAt,
    endsAt,
    now: NOW,
  })
  if (created.isLeft()) throw new Error('invalid arrangement')

  return created.value
}

test.group('Notice', () => {
  test('an end that is not after the start is NOTICE_INVALID_PERIOD', ({ assert }) => {
    const same = Notice.create({
      id: 'id',
      title: 'Aviso',
      body: 'Texto',
      startsAt: NOW,
      endsAt: NOW,
      now: NOW,
    })

    assert.deepEqual(same.value, { code: 'NOTICE_INVALID_PERIOD' })
  })

  test('the status is derived from the dates: scheduled, active, closed by end date', ({
    assert,
  }) => {
    assert.equal(notice(at(1)).status(NOW), 'SCHEDULED')
    assert.equal(notice(at(-1)).status(NOW), 'ACTIVE')
    assert.equal(notice(at(-1), at(1)).status(NOW), 'ACTIVE')
    assert.equal(notice(at(-2), at(-1)).status(NOW), 'CLOSED')
    assert.equal(notice(at(-2), at(-1)).status(at(-1.5)), 'ACTIVE')
  })

  test('closing by hand wins over the dates, and closing twice is NOTICE_ALREADY_CLOSED', ({
    assert,
  }) => {
    const entity = notice(at(-1), at(5))

    assert.isTrue(entity.close(NOW).isRight())
    assert.equal(entity.status(NOW), 'CLOSED')
    assert.deepEqual(entity.close(NOW).value, { code: 'NOTICE_ALREADY_CLOSED' })
  })

  test('updating keeps the period valid: moving the start past the end is refused', ({
    assert,
  }) => {
    const entity = notice(at(-1), at(2))

    assert.deepEqual(entity.update({ startsAt: at(3) }, NOW).value, {
      code: 'NOTICE_INVALID_PERIOD',
    })
    assert.isTrue(entity.update({ endsAt: null }, NOW).isRight())
    assert.isNull(entity.snapshot().endsAt)
  })
})
