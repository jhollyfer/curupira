import { test } from '@japa/runner'

import { Neighborhood } from './neighborhood.entity.ts'

const NOW = new Date('2026-10-29T12:00:00Z')
const LATER = new Date('2026-10-30T12:00:00Z')

function neighborhood(center?: { latitude: number; longitude: number }): Neighborhood {
  const created = Neighborhood.create({ id: 'id', name: 'Porto Cajuí', ...center, now: NOW })
  if (created.isLeft()) throw new Error('invalid arrangement')

  return created.value
}

test.group('Neighborhood', () => {
  test('is born with the slug from the name and the edit stamped', ({ assert }) => {
    assert.deepInclude(neighborhood().snapshot(), {
      slug: 'porto-cajui',
      latitude: null,
      longitude: null,
      createdAt: NOW,
      updatedAt: NOW,
    })
  })

  test('a center needs both coordinates', ({ assert }) => {
    const half = Neighborhood.create({ id: 'id', name: 'Centro', latitude: -4.3, now: NOW })

    assert.deepEqual(half.value, { code: 'NEIGHBORHOOD_CENTER_INCOMPLETE' })
  })

  test('renaming re-derives the slug; the same name does not count as a rename', ({ assert }) => {
    const entity = neighborhood()

    assert.isFalse(entity.renamesTo('Porto Cajuí'))
    assert.isTrue(entity.renamesTo('Cajuí'))
    entity.update({ name: 'Cajuí' }, LATER)
    assert.deepInclude(entity.snapshot(), { name: 'Cajuí', slug: 'cajui', updatedAt: LATER })
  })

  test('absent coordinates stay, null erases both, null on one is refused', ({ assert }) => {
    const entity = neighborhood({ latitude: -4.3, longitude: -70 })

    entity.update({ name: 'Outro' }, LATER)
    assert.deepInclude(entity.snapshot(), { latitude: -4.3, longitude: -70 })

    assert.deepEqual(entity.update({ latitude: null }, LATER).value, {
      code: 'NEIGHBORHOOD_CENTER_INCOMPLETE',
    })

    entity.update({ latitude: null, longitude: null }, LATER)
    assert.deepInclude(entity.snapshot(), { latitude: null, longitude: null })
  })
})
