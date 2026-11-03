import { join } from 'node:path'

import { test } from '@japa/runner'

import { introspect } from './introspect.ts'

/**
 * The generator also reads the `_shared.<resource>-refusal.ts` that the use case imports
 * (`_standards/openapi.md`, "erros-do-use-case", `DECISIONS.md` #259): the
 * controller does not declare what the translator already says.
 */
const FEATURES = join(import.meta.dirname, '../../app/features')

test.group('scripts > openapi > introspect (unit)', () => {
  test('reads from the translator the code the use-case fact produces', async ({
    assert,
  }) => {
    const found = await introspect(
      join(FEATURES, 'management/neighborhoods/update/update.controller.ts'),
    )
    const codes = found?.errors.map((error) => error.code) ?? []

    assert.include(codes, 'NEIGHBORHOOD_ALREADY_EXISTS')
    assert.include(codes, 'NEIGHBORHOOD_CENTER_INCOMPLETE')
  })

  test('follows the `_shared` translator of another feature the use case imports', async ({
    assert,
  }) => {
    const found = await introspect(
      join(FEATURES, 'storefront/reports/create/create.controller.ts'),
    )
    const errors = found?.errors ?? []

    assert.isTrue(
      errors.some(
        (error) => error.code === 'REPORT_PHOTO_TAKEN' && error.status === 422,
      ),
    )
    assert.isTrue(
      errors.some(
        (error) => error.code === 'STORAGE_NOT_FOUND' && error.status === 422,
      ),
    )
  })

  test('brings the pt-BR message of the translator key', async ({ assert }) => {
    const found = await introspect(
      join(FEATURES, 'management/neighborhoods/create/create.controller.ts'),
    )
    const conflict = found?.errors.find(
      (error) => error.code === 'NEIGHBORHOOD_ALREADY_EXISTS',
    )

    assert.isString(conflict?.message)
    assert.notInclude(conflict?.message ?? '', 'neighborhoods.')
  })
})
