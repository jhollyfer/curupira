import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type ManagementScheduleShowResponse,
} from '@curupira/shared'

import { ScheduleRefusal } from '../_shared.schedule-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, ManagementScheduleShowResponse>

@inject()
export default class ManagementScheduleShowUseCase {
  constructor(
    private readonly schedules: CollectionScheduleRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const detail = await this.schedules.detail(id)
      if (!detail) return left(ScheduleRefusal.notFound(this.i18n))

      return right(detail)
    } catch (error) {
      logger.error({ err: error }, '[management/schedules > show][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_SCHEDULE_SHOW_ERROR',
        ),
      )
    }
  }
}
