import { test } from '@japa/runner'

import { Report } from './report.entity.ts'

const NOW = new Date('2026-10-29T12:00:00Z')
const LATER = new Date('2026-10-30T12:00:00Z')

function report(contact?: string): Report {
  return Report.receive({
    id: 'r1',
    eventId: 'e1',
    protocol: 'CUR-2ABC-3DEF',
    kind: 'BURNING',
    latitude: -4.37,
    longitude: -70.03,
    neighborhoodId: null,
    contact,
    photoIds: ['p1'],
    now: NOW,
  })
}

const step = (
  status: 'IN_REVIEW' | 'FORWARDED' | 'RESOLVED' | 'RECEIVED',
  eventId = 'e2',
) => ({
  eventId,
  status,
  message: 'Em análise',
  authorId: 'u1',
})

test.group('Report', () => {
  test('is born RECEIVED with its first timeline event, written by nobody', ({
    assert,
  }) => {
    const snapshot = report().snapshot()

    assert.equal(snapshot.status, 'RECEIVED')
    assert.deepEqual(snapshot.events, [
      { id: 'e1', status: 'RECEIVED', message: null, authorId: null, at: NOW },
    ])
  })

  test('is anonymous exactly when there is no contact', ({ assert }) => {
    assert.isTrue(report().snapshot().anonymous)
    assert.isFalse(report('(97) 99999-0000').snapshot().anonymous)
  })

  test('advancing moves the status and appends an event with the author and the message', ({
    assert,
  }) => {
    const entity = report()

    assert.isTrue(entity.advance(step('IN_REVIEW'), LATER).isRight())

    const snapshot = entity.snapshot()
    assert.equal(snapshot.status, 'IN_REVIEW')
    assert.deepEqual(snapshot.events.at(-1), {
      id: 'e2',
      status: 'IN_REVIEW',
      message: 'Em análise',
      authorId: 'u1',
      at: LATER,
    })
    assert.equal(snapshot.updatedAt, LATER)
  })

  test('skipping steps forward is allowed', ({ assert }) => {
    const entity = report()

    assert.isTrue(entity.advance(step('FORWARDED'), LATER).isRight())
  })

  test('going back or repeating is REPORT_STATUS_REGRESSION and writes nothing', ({
    assert,
  }) => {
    const entity = report()
    entity.advance(step('FORWARDED'), LATER)

    const back = entity.advance(step('IN_REVIEW', 'e3'), LATER)
    const same = entity.advance(step('FORWARDED', 'e4'), LATER)

    assert.deepEqual(back.value, { code: 'REPORT_STATUS_REGRESSION' })
    assert.deepEqual(same.value, { code: 'REPORT_STATUS_REGRESSION' })
    assert.lengthOf(entity.snapshot().events, 2)
  })
})
