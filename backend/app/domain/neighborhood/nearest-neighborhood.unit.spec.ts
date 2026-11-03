import { test } from '@japa/runner'

import { NearestNeighborhood, distanceKm } from './nearest-neighborhood.ts'

const CENTRO = { id: 'centro', latitude: -4.3769, longitude: -70.0314 }
const COHAB = { id: 'cohab', latitude: -4.3841, longitude: -70.0268 }

test.group('NearestNeighborhood', () => {
  test('distance is zero at the same point and roughly 111 km per degree of latitude', ({
    assert,
  }) => {
    assert.equal(distanceKm(CENTRO, CENTRO), 0)
    assert.closeTo(
      distanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 }),
      111.19,
      0.5,
    )
  })

  test('picks the closest center', ({ assert }) => {
    const near = { latitude: -4.3835, longitude: -70.0272 }

    assert.equal(NearestNeighborhood.of(near, [CENTRO, COHAB]), 'cohab')
  })

  test('no center within the limit is null, and so is an empty list', ({
    assert,
  }) => {
    const farAway = { latitude: -3.1, longitude: -60 }

    assert.isNull(NearestNeighborhood.of(farAway, [CENTRO, COHAB]))
    assert.isNull(NearestNeighborhood.of(CENTRO, []))
  })
})
