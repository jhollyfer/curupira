import { test } from '@japa/runner'

import { CorsOrigins } from '#core/cors-origins'

/**
 * `CORS_ORIGINS` feeds the CORS allowlist and the origin barrier. A wrong entry does not
 * throw at request time: it just matches nobody, so the frontend gets 403 on every write.
 */
test.group('CorsOrigins', () => {
  test('a single origin and a comma separated list', ({ assert }) => {
    assert.deepEqual(CorsOrigins.parse('https://curupira.maiyu.com.br'), [
      'https://curupira.maiyu.com.br',
    ])
    assert.deepEqual(
      CorsOrigins.parse('http://localhost:3000, http://localhost:3010'),
      ['http://localhost:3000', 'http://localhost:3010'],
    )
  })

  test('refuses an empty value, or one that is only separators', ({
    assert,
  }) => {
    assert.throws(() => CorsOrigins.parse(''), /CORS_ORIGINS/)
    assert.throws(() => CorsOrigins.parse(' , '), /CORS_ORIGINS/)
  })

  test('refuses the wildcard: the API uses cookies', ({ assert }) => {
    assert.throws(() => CorsOrigins.parse('*'), /must not be \*/)
    assert.throws(
      () => CorsOrigins.parse('https://a.example,*'),
      /must not be \*/,
    )
  })

  test('refuses a trailing slash and a path: the Origin header never carries them', ({
    assert,
  }) => {
    assert.throws(
      () => CorsOrigins.parse('https://a.example/'),
      /no path or trailing slash/,
    )
    assert.throws(
      () => CorsOrigins.parse('https://a.example/app'),
      /no path or trailing slash/,
    )
  })

  test('refuses what is not an http or https URL', ({ assert }) => {
    assert.throws(() => CorsOrigins.parse('a.example'), /not a URL/)
    assert.throws(() => CorsOrigins.parse('ftp://a.example'), /http or https/)
  })

  test('the env validator fails without the key and returns the list otherwise', ({
    assert,
  }) => {
    assert.throws(
      () => CorsOrigins.validate('CORS_ORIGINS', undefined),
      /is required/,
    )
    assert.deepEqual(
      CorsOrigins.validate('CORS_ORIGINS', 'http://localhost:3000'),
      ['http://localhost:3000'],
    )
  })
})
