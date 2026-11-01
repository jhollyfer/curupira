import { column } from '@adonisjs/lucid/orm'
import type { ReportKind, ReportStatus } from '@curupira/shared'

import { ReportSchema } from '#database/schema'

/** The environmental report. `contact` is personal data: only the panel repository reads it. */
export default class Report extends ReportSchema {
  @column()
  declare kind: ReportKind

  @column()
  declare status: ReportStatus
}
