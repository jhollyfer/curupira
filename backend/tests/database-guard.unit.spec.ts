import { test } from '@japa/runner'

import { DatabaseGuard } from '#tests/database-guard'

test.group('tests > database-guard (unit)', () => {
  test('accepts a database that ends in _test', ({ assert }) => {
    assert.doesNotThrow(() =>
      DatabaseGuard.assertTestDatabase('postgres://u:p@localhost:5434/curupira_test'),
    )
  })

  test('accepts the query string after the database name', ({ assert }) => {
    assert.doesNotThrow(() =>
      DatabaseGuard.assertTestDatabase('postgres://u:p@localhost/curupira_test?sslmode=disable'),
    )
  })

  test('refuses the development database', ({ assert }) => {
    assert.throws(
      () => DatabaseGuard.assertTestDatabase('postgres://u:p@localhost:5434/curupira'),
      /refuses to start/,
    )
  })

  test('rejects _test in the middle of the name', ({ assert }) => {
    assert.throws(
      () => DatabaseGuard.assertTestDatabase('postgres://u:p@localhost/curupira_test_prod'),
      /refuses to start/,
    )
  })

  test('refuses a missing URL', ({ assert }) => {
    assert.throws(() => DatabaseGuard.assertTestDatabase(undefined), /DATABASE_URL missing/)
  })
})
