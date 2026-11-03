import { test } from '@japa/runner'

import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import { ReportFactory } from '#database/factories/report.factory'
import {
  authenticateAsAdministrator,
  authenticateAsOperator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('management/reports > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists with the neighborhood name, no contact and no description', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const neighborhood = await NeighborhoodFactory.create()
    await ReportFactory.apply('identified')
      .merge({ neighborhoodId: neighborhood.id })
      .create()

    const response = await client.get('/management/reports').cookies(session)

    response.assertStatus(200)
    assert.equal(body(response).data[0].neighborhoodName, neighborhood.name)
    assert.notProperty(body(response).data[0], 'contact')
    assert.notProperty(body(response).data[0], 'description')
  })

  test('cuts by kind, status and neighborhood', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    await ReportFactory.merge({ kind: 'BURNING' }).create()
    await ReportFactory.merge({ kind: 'DUMPING', status: 'RESOLVED' }).create()
    await ReportFactory.merge({ neighborhoodId: neighborhood.id }).create()

    const total = async (query: string) => {
      const response = await client
        .get(`/management/reports?${query}`)
        .cookies(session)
      response.assertStatus(200)

      return body(response).meta.total
    }

    assert.equal(await total('kind=BURNING'), 1)
    assert.equal(await total('status=RESOLVED'), 1)
    assert.equal(await total(`neighborhoodId=${neighborhood.id}`), 1)
    assert.equal(await total(''), 3)
  })

  test('cuts by period and searches by protocol', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsOperator(client)
    const old = await ReportFactory.create()
    await ReportFactory.create()
    await old.merge({ createdAt: old.createdAt.minus({ days: 40 }) }).save()

    const recent = await client
      .get(
        `/management/reports?from=${encodeURIComponent(old.createdAt.plus({ days: 1 }).toISO() ?? '')}`,
      )
      .cookies(session)
    const found = await client
      .get(`/management/reports?search=${old.protocol}`)
      .cookies(session)

    assert.equal(body(recent).meta.total, 1)
    assert.equal(body(found).meta.total, 1)
  })

  test('an invalid filter responds 422 and no session responds 401', async ({
    client,
  }) => {
    const session = await authenticateAsOperator(client)

    const invalid = await client
      .get('/management/reports?kind=PARTY&from=ontem')
      .cookies(session)
    const anonymous = await client.get('/management/reports')

    invalid.assertStatus(422)
    anonymous.assertStatus(401)
  })
})
