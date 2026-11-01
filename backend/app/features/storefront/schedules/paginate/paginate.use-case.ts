import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type Paginated,
  type StorefrontScheduleShowResponse,
} from '@curupira/shared'

import { MemoryPagination } from '#core/memory-pagination'
import HTTPException from '#exceptions/http.exception'
import { CollectionScheduleRepository } from '#repositories/collection-schedule/collection-schedule.repository'
import type { StorefrontSchedulePaginatePayload } from '#validators/storefront/schedules.validator'

type Payload = StorefrontSchedulePaginatePayload
type Response = Either<HTTPException, Paginated<StorefrontScheduleShowResponse>>

@inject()
export default class StorefrontSchedulePaginateUseCase {
  constructor(
    private readonly schedules: CollectionScheduleRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const week = await this.schedules.listWeek(payload.neighborhoodId)

      return right(MemoryPagination.slice(week, 1, Math.max(week.length, 1)))
    } catch (error) {
      logger.error({ err: error }, '[storefront/schedules > paginate][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_SCHEDULE_PAGINATE_ERROR',
        ),
      )
    }
  }
}
