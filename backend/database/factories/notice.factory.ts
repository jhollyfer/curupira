import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

import Notice from '#models/notice'

/** An active notice: started yesterday, no end. States make the other two phases. */
export const NoticeFactory = factory
  .define(Notice, ({ faker }) => ({
    title: faker.lorem.words(3),
    body: faker.lorem.sentence(),
    startsAt: DateTime.now().minus({ days: 1 }),
    endsAt: null,
    closedAt: null,
  }))
  .state('scheduled', (notice) => {
    notice.startsAt = DateTime.now().plus({ days: 2 })
  })
  .state('expired', (notice) => {
    notice.startsAt = DateTime.now().minus({ days: 5 })
    notice.endsAt = DateTime.now().minus({ days: 1 })
  })
  .state('closed', (notice) => {
    notice.closedAt = DateTime.now().minus({ hours: 1 })
  })
  .build()
