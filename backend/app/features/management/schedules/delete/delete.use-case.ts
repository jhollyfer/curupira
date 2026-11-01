import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either } from '@curupira/shared'

import { ScheduleRefusal } from '../_shared.schedule-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

@inject()
export default class ManagementScheduleDeleteUseCase {
  constructor(
    private readonly schedules: CollectionScheduleRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const schedule = await this.schedules.findById(id)
      if (!schedule) return left(ScheduleRefusal.notFound(this.i18n))

      await this.schedules.delete(schedule)

      return right(null)
    } catch (error) {
      logger.error({ err: error }, '[management/schedules > delete][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_SCHEDULE_DELETE_ERROR'),
      )
    }
  }
}
