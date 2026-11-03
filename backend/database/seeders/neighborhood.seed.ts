import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Slug } from '@curupira/shared'

import Neighborhood from '#models/neighborhood'

/**
 * The 14 neighborhoods of Benjamin Constant (AM), from the municipality's official list of
 * registered neighborhoods ("Bairros da Cidade"), so the resident has a list to pick from
 * on day one.
 *
 * The list carries names only: **there is no official coordinate**, so none is invented
 * here. A neighborhood without a point is still picked from the list; what it loses is the
 * automatic "nearest neighborhood" suggestion on the report map, which needs a center. The
 * administrator places each point in the panel (`/management/neighborhoods`), where the
 * real data belongs. The demonstration seed does not depend on them (its reports fall back
 * to the city center).
 *
 * Outside `test` (the suite creates what it needs, and a seeded name would collide with the
 * test `unique`). Idempotent: running again reasserts, it does not duplicate; it never
 * removes a neighborhood a previous version of this list created, because schedules and
 * reports may point to it.
 */
export const NEIGHBORHOODS = [
  { name: 'Agropalmin' },
  { name: 'Alzenir Magalhães' },
  { name: 'Bom Jardim' },
  { name: 'Castanhal' },
  { name: 'Centro' },
  { name: 'Cidade Nova' },
  { name: 'Cohabam' },
  { name: 'Coimbra' },
  { name: 'Colônia I' },
  { name: 'Colônia II' },
  { name: 'Eduardo Braga' },
  { name: 'Javarizinho' },
  { name: 'Monte da Redenção' },
  { name: 'Umarizal' },
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
