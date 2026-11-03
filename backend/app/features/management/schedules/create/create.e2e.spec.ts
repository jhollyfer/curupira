import { test } from '@japa/runner'

import { CollectionScheduleFactory } from '#database/factories/collection-schedule.factory'
import { NeighborhoodFactory } from '#database/factories/neighborhood.factory'
import {
  authenticateAsAdministrator,
  authenticateAsOperator,
  body,
  invalidPayload,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const SLOT = {
  wasteType: 'RECYCLABLE',
  weekday: 'TUESDAY',
  shift: 'AFTERNOON',
} as const

test.group('management/schedules > create', (group) => {
  group.each.setup(() => resetDatabase())

  test('creates the slot and answers with the neighborhood name', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()

    const response = await client
      .post('/management/schedules')
      .cookies(session)
      .json({ neighborhoodId: neighborhood.id, ...SLOT, note: 'Até as 14h' })

    response.assertStatus(201)
    assert.deepInclude(body(response), {
      neighborhoodName: neighborhood.name,
      ...SLOT,
    })
    assert.isNotNull(await Stored.schedule(body(response).id))
  })

  test('the same neighborhood, type, weekday and shift responds 409', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()
    await CollectionScheduleFactory.merge({
      neighborhoodId: neighborhood.id,
      ...SLOT,
    }).create()

    const response = await client
      .post('/management/schedules')
      .cookies(session)
      .json({ neighborhoodId: neighborhood.id, ...SLOT })

    response.assertStatus(409)
    assert.equal(body(response).code, 'SCHEDULE_ALREADY_EXISTS')
    assert.lengthOf(await Stored.schedulesOfNeighborhood(neighborhood.id), 1)
  })

  test('an unknown neighborhood responds 422 pointing at the field', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/management/schedules')
      .cookies(session)
      .json({ neighborhoodId: '00000000-0000-4000-8000-000000000000', ...SLOT })

    response.assertStatus(422)
    assert.property(body(response).errors, 'neighborhoodId')
  })

  test('a value outside the enums responds 422', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const neighborhood = await NeighborhoodFactory.create()

    const response = await client
      .post('/management/schedules')
      .cookies(session)
      .json(
        invalidPayload({
          neighborhoodId: neighborhood.id,
          wasteType: 'GOLD',
          weekday: 'FUNDAY',
          shift: 'LATE',
        }),
      )

    response.assertStatus(422)
    assert.property(body(response).errors, 'wasteType')
    assert.property(body(response).errors, 'weekday')
    assert.property(body(response).errors, 'shift')
  })

  test('without a session responds 401 and the operator responds 403', async ({
    client,
  }) => {
    const anonymous = await client.post('/management/schedules').json({})
    const operator = await authenticateAsOperator(client)
    const forbidden = await client
      .post('/management/schedules')
      .cookies(operator)
      .json({})

    anonymous.assertStatus(401)
    forbidden.assertStatus(403)
  })
})
