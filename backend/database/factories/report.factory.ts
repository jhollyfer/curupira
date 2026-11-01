import { randomUUID } from 'node:crypto'

import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { PROTOCOL_ALPHABET, REPORT_KIND, REPORT_STATUS, formatProtocol } from '@curupira/shared'

import Report from '#models/report'
import ReportStatusEvent from '#models/report-status-event'

let counter = 0

/** A distinct valid protocol per call, without randomness: a flaky `unique` has no place in a spec. */
function protocol(): string {
  counter += 1
  const symbols = counter.toString(32).toUpperCase().padStart(8, '0')

  return formatProtocol(
    [...symbols].map((symbol) => (PROTOCOL_ALPHABET.includes(symbol) ? symbol : '0')).join(''),
  )
}

/**
 * A received, anonymous report with its first timeline event (an `after create` hook: a
 * report with no event is a state the application never produces). `anonymous` follows
 * `contact`, the way the entity derives it.
 */
export const ReportFactory = factory
  .define(Report, ({ faker }) => ({
    protocol: protocol(),
    kind: REPORT_KIND.DUMPING,
    status: REPORT_STATUS.RECEIVED,
    latitude: -4.3769 + faker.number.float({ min: -0.01, max: 0.01 }),
    longitude: -70.0314 + faker.number.float({ min: -0.01, max: 0.01 }),
    description: faker.lorem.sentence(),
    contact: null,
    anonymous: true,
  }))
  .state('identified', (report, { faker }) => {
    report.contact = faker.phone.number()
    report.anonymous = false
  })
  .after('create', async (_factory, report) => {
    await ReportStatusEvent.create({
      id: randomUUID(),
      reportId: report.id,
      status: REPORT_STATUS.RECEIVED,
      message: null,
      authorId: null,
      at: report.createdAt ?? DateTime.now(),
    })
  })
  .build()
