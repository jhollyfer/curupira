import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Slug } from '@curupira/shared'

import Neighborhood from '#models/neighborhood'

/**
 * The neighborhoods of Benjamin Constant (AM), so the resident has a list to pick from on
 * day one.
 *
 * **EXAMPLE DATA, TO BE CONFIRMED with the city hall before publishing**: the names are the
 * ones commonly used for the city's neighborhoods and communities, but the official list
 * and the exact spelling come from the prefecture, and the centers below are approximate
 * points around the urban area, good enough for the nearest-neighborhood match of a demo
 * and not a survey. Fix them in the panel (`/management/neighborhoods`), never here, once
 * the real data exists.
 *
 * Outside `test` (the suite creates what it needs, and a seeded name would collide with the
 * test `unique`). Idempotent: running again reasserts, it does not duplicate.
 */
export const NEIGHBORHOODS = [
  { name: 'Centro', latitude: -4.3769, longitude: -70.0314 },
  { name: 'Cohab', latitude: -4.3841, longitude: -70.0268 },
  { name: 'Umariaçu', latitude: -4.3652, longitude: -70.0147 },
  { name: 'Porto Cajuí', latitude: -4.3705, longitude: -70.0408 },
  { name: 'São Francisco', latitude: -4.3812, longitude: -70.0359 },
  { name: 'Bom Jesus', latitude: -4.3733, longitude: -70.0231 },
  { name: 'Nazaré', latitude: -4.3688, longitude: -70.0276 },
  { name: 'Ibirapuera', latitude: -4.3879, longitude: -70.0322 },
  { name: 'Santa Rita', latitude: -4.3796, longitude: -70.0197 },
  { name: 'Colônia', latitude: -4.3917, longitude: -70.0251 },
  { name: 'Livramento', latitude: -4.3624, longitude: -70.0352 },
  { name: 'Prosperidade', latitude: -4.3858, longitude: -70.0389 },
] as const

export default class NeighborhoodSeeder extends BaseSeeder {
  static override environment = ['development', 'production']

  override async run() {
    for (const neighborhood of NEIGHBORHOODS) {
      const slug = Slug.from(neighborhood.name).value
      await Neighborhood.updateOrCreate({ slug }, { ...neighborhood, slug })
    }
  }
}
