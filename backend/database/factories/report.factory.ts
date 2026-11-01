import { randomUUID } from 'node:crypto'

import factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'
import { REPORT_KIND, REPORT_STATUS, formatProtocol } from '@curupira/shared'

import Report from '#models/report'
import ReportStatusEvent from '#models/report-status-event'

let counter = 0

/** A distinct valid protocol per call, without randomness: a flaky `unique` has no place in a spec. */
function protocol(): string {
  counter += 1
  // Base 32 digits (0-9, a-v) contain `I`, `L`, `O` and `U`, which the protocol alphabet
  // leaves out; `Z` is not a base 32 digit, so the replacement cannot collide with another counter.
  const symbols = counter.toString(32).toUpperCase().padStart(8, '0')

  return formatProtocol(symbols.replace(/[ILOU]/g, 'Z'))
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
    // The factory creates the report inside a transaction and runs this hook before it
    // commits: the event must join that same transaction, or its foreign key cannot see the row.
    await ReportStatusEvent.create(
      {
        id: randomUUID(),
        reportId: report.id,
        status: REPORT_STATUS.RECEIVED,
        message: null,
        authorId: null,
        at: report.createdAt ?? DateTime.now(),
      },
      { client: report.$trx },
    )
  })
  .build()
