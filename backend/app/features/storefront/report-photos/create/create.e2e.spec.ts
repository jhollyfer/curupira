import { test } from '@japa/runner'

import { body, resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

test.group('storefront/report-photos > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('anyone opens a PENDING upload and gets the signed PUT', async ({ client, assert }) => {
    const response = await client
      .post('/storefront/report-photos')
      .json({ mimetype: 'image/jpeg', size: 4096 })

    response.assertStatus(201)
    assert.match(body(response).uploadUrl, /^http/)
    assert.deepEqual(Object.keys(body(response)).sort(), ['id', 'uploadUrl'])
    const stored = await Stored.storageOrFail(body(response).id)
    assert.equal(stored.status, 'PENDING')
    assert.match(stored.path, /\.jpg$/)
  })

  test('a type outside jpeg, png and webp responds 422 and signs nothing', async ({
    client,
    assert,
  }) => {
    for (const mimetype of ['application/pdf', 'image/gif', 'image/svg+xml', 'text/html']) {
      const response = await client.post('/storefront/report-photos').json({ mimetype, size: 1024 })

      response.assertStatus(422)
      assert.property(body(response).errors, 'mimetype')
    }
    assert.lengthOf(await Stored.storages(), 0)
  })

  test('a size above the configured ceiling or below one byte responds 422', async ({
    client,
    assert,
  }) => {
    const tooBig = await client
      .post('/storefront/report-photos')
      .json({ mimetype: 'image/png', size: 10 * 1024 * 1024 + 1 })
    const empty = await client
      .post('/storefront/report-photos')
      .json({ mimetype: 'image/png', size: 0 })

    tooBig.assertStatus(422)
    empty.assertStatus(422)
    assert.property(body(tooBig).errors, 'size')
    assert.lengthOf(await Stored.storages(), 0)
  })

  test('a foreign origin cannot write (CSRF barrier applies to the public writes too)', async ({
    client,
  }) => {
    const response = await client
      .post('/storefront/report-photos')
      .header('origin', 'https://evil.example')
      .json({ mimetype: 'image/png', size: 1024 })

    response.assertStatus(403)
  })
})
