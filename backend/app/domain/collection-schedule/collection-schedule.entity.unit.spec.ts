import { test } from '@japa/runner'

import { CollectionSchedule } from './collection-schedule.entity.ts'

const NOW = new Date('2026-10-29T12:00:00Z')
const LATER = new Date('2026-10-30T12:00:00Z')

function slot(): CollectionSchedule {
  return CollectionSchedule.create({
    id: 'id',
    neighborhoodId: 'n1',
    wasteType: 'ORGANIC',
    weekday: 'MONDAY',
    shift: 'MORNING',
    now: NOW,
  })
}

test.group('CollectionSchedule', () => {
  test('is born without a note', ({ assert }) => {
    assert.deepInclude(slot().snapshot(), { note: null, createdAt: NOW, updatedAt: NOW })
  })

  test('an absent field leaves alone and null on the note erases it', ({ assert }) => {
    const entity = slot()

    entity.update({ note: 'Só até as 9h' }, LATER)
    entity.update({ weekday: 'FRIDAY' }, LATER)
    assert.deepInclude(entity.snapshot(), { weekday: 'FRIDAY', note: 'Só até as 9h' })

    entity.update({ note: null }, LATER)
    assert.isNull(entity.snapshot().note)
  })
})
