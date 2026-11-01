import factory from '@adonisjs/lucid/factories'
import { Slug } from '@curupira/shared'

import Neighborhood from '#models/neighborhood'

/**
 * Neighborhood without a center. The slug follows the name the way the entity derives it,
 * and a counter keeps two factory neighborhoods from colliding on the `unique` name.
 */
let sequence = 0

export const NeighborhoodFactory = factory
  .define(Neighborhood, () => {
    sequence += 1
    const name = `Bairro ${sequence}`

    return { name, slug: Slug.from(name).value }
  })
  .state('centered', (neighborhood) => {
    neighborhood.latitude = -4.3769
    neighborhood.longitude = -70.0314
  })
  .build()
