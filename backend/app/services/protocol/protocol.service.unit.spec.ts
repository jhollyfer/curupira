import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { PROTOCOL_ALPHABET, PROTOCOL_PATTERN, normalizeProtocol } from '@curupira/shared'

import { ProtocolContract } from '#services/protocol/protocol.contract'

test.group('services > protocol (unit)', () => {
  test('every code has the canonical shape and only alphabet symbols', async ({ assert }) => {
    const service = await app.container.make(ProtocolContract)

    for (let index = 0; index < 500; index++) {
      const protocol = service.next()

      assert.match(protocol, PROTOCOL_PATTERN)
      assert.isTrue(
        [...protocol.replace(/^CUR-/, '').replace('-', '')].every((symbol) =>
          PROTOCOL_ALPHABET.includes(symbol),
        ),
      )
      assert.equal(normalizeProtocol(protocol), protocol)
    }
  })

  test('is not a sequence: 500 draws collide at most a handful of times (2^40 space)', async ({
    assert,
  }) => {
    const service = await app.container.make(ProtocolContract)
    const draws = new Set(Array.from({ length: 500 }, () => service.next()))

    assert.isAtLeast(draws.size, 499)
  })
})
