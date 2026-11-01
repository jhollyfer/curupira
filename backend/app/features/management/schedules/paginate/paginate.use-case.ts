import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  PAGINATION,
  left,
  right,
  type Either,
  type ManagementScheduleShowResponse,
  type Paginated,
} from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import type { ManagementSchedulePaginatePayload } from '#validators/management/schedules.validator'

type Payload = ManagementSchedulePaginatePayload
type Response = Either<HTTPException, Paginated<ManagementScheduleShowResponse>>

@inject()
export default class ManagementSchedulePaginateUseCase {
  constructor(
    private readonly schedules: CollectionScheduleRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      return right(
        await this.schedules.paginate({
          page: payload.page ?? PAGINATION.PAGE,
          perPage: payload.perPage ?? PAGINATION.PER_PAGE,
          neighborhoodId: payload.neighborhoodId,
        }),
      )
    } catch (error) {
      logger.error({ err: error }, '[management/schedules > paginate][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_SCHEDULE_PAGINATE_ERROR',
        ),
      )
    }
  }
}
