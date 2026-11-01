import { column } from '@adonisjs/lucid/orm'
import type { ReportStatus } from '@curupira/shared'

import { ReportStatusEventSchema } from '#database/schema'

/** One line of a report's timeline. */
export default class ReportStatusEvent extends ReportStatusEventSchema {
  @column()
  declare status: ReportStatus
}
