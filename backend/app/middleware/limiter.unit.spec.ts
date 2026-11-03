import { test } from '@japa/runner'

import { LimiterKey } from '#start/limiter'

test.group('start/limiter > LimiterKey (unit)', () => {
  test('the account e-mail is normalized: trim and lower case', ({
    assert,
  }) => {
    assert.equal(
      LimiterKey.account('  Ana@Escola.COM '),
      'signin:ana@escola.com',
    )
    assert.equal(
      LimiterKey.account('ana@escola.com'),
      LimiterKey.account('ANA@ESCOLA.COM'),
    )
  })

  test('without a usable e-mail there is no account key', ({ assert }) => {
    assert.isNull(LimiterKey.account(undefined))
    assert.isNull(LimiterKey.account(42))
    assert.isNull(LimiterKey.account('   '))
  })

  test('the per-user key carries the scope and the id', ({ assert }) => {
    assert.equal(LimiterKey.user('upload', { id: 'u1' }), 'upload:u1')
    assert.notEqual(
      LimiterKey.user('upload', { id: 'u1' }),
      LimiterKey.user('export', { id: 'u1' }),
    )
  })

  test('without a session there is no per-user key', ({ assert }) => {
    assert.isNull(LimiterKey.user('upload', undefined))
  })

  test('the anonymous key hides the IP and keeps one bucket per IP', ({
    assert,
  }) => {
    const key = LimiterKey.anonymous('203.0.113.9', 'secret-a')

    assert.notInclude(key, '203.0.113.9')
    assert.equal(key, LimiterKey.anonymous('203.0.113.9', 'secret-a'))
    assert.notEqual(key, LimiterKey.anonymous('203.0.113.10', 'secret-a'))
  })

  test('the anonymous key depends on the secret, so the IP cannot be recovered by brute force', ({
    assert,
  }) => {
    assert.notEqual(
      LimiterKey.anonymous('203.0.113.9', 'secret-a'),
      LimiterKey.anonymous('203.0.113.9', 'secret-b'),
    )
  })

  test('the secret is derived from APP_KEY, never the key itself', ({
    assert,
  }) => {
    const derived = LimiterKey.secretFrom('app-key-value')

    assert.notInclude(derived, 'app-key-value')
    assert.equal(derived, LimiterKey.secretFrom('app-key-value'))
  })
})
