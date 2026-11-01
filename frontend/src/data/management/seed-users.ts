import type { ManagementUserShowResponse } from '@curupira/shared'

import { exampleUuid } from '../ids'

export const SEEDED_AT = '2026-01-10T12:00:00-05:00'

/**
 * EXAMPLE accounts of the panel. The first two are the ones the mock sign-in offers
 * (`session.ts`); the id of the administrator is the logged-in user in mock mode, which
 * is what the "nobody deletes themselves" rule is checked against.
 */
export const MOCK_ADMINISTRATOR_ID = exampleUuid('f', 1)
export const MOCK_OPERATOR_ID = exampleUuid('f', 2)

export function seedUsers(): Array<ManagementUserShowResponse> {
  const rows = [
    [
      'Marcelo Tananta',
      'marcelo.tananta@exemplo.invalid',
      'ADMINISTRATOR',
      'ACTIVE',
    ],
    [
      'Rosângela Pinto',
      'rosangela.pinto@exemplo.invalid',
      'OPERATOR',
      'ACTIVE',
    ],
    ['Edvaldo Cruz', 'edvaldo.cruz@exemplo.invalid', 'OPERATOR', 'ACTIVE'],
    [
      'Lucimar Ferreira',
      'lucimar.ferreira@exemplo.invalid',
      'OPERATOR',
      'INACTIVE',
    ],
    [
      'Antônia Ramos',
      'antonia.ramos@exemplo.invalid',
      'ADMINISTRATOR',
      'ACTIVE',
    ],
    ['Josué Mendonça', 'josue.mendonca@exemplo.invalid', 'OPERATOR', 'ACTIVE'],
  ] as const

  return rows.map(([name, email, role, status], index) => ({
    id: exampleUuid('f', index + 1),
    name,
    email,
    role,
    status,
    createdAt: SEEDED_AT,
    updatedAt: null,
  }))
}
