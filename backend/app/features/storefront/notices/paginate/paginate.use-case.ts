import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type Paginated,
  type StorefrontNoticeShowResponse,
} from '@curupira/shared'

import { MemoryPagination } from '#core/memory-pagination'
import HTTPException from '#exceptions/http.exception'
import { NoticeRepository } from '#repositories/notice/notice.repository'

type Response = Either<HTTPException, Paginated<StorefrontNoticeShowResponse>>

@inject()
export default class StorefrontNoticePaginateUseCase {
  constructor(
    private readonly notices: NoticeRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      const active = await this.notices.listActive(new Date())

      return right(
        MemoryPagination.slice(active, 1, Math.max(active.length, 1)),
      )
    } catch (error) {
      logger.error({ err: error }, '[storefront/notices > paginate][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_NOTICE_PAGINATE_ERROR',
        ),
      )
    }
  }
}
