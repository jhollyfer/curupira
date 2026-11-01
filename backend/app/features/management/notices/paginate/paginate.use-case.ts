import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  PAGINATION,
  SORT_DIRECTION,
  left,
  right,
  type Either,
  type ManagementNoticeShowResponse,
  type Paginated,
} from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { NoticeRepository } from '#repositories/notice/notice.repository'
import type { ManagementNoticePaginatePayload } from '#validators/management/notices.validator'

type Payload = ManagementNoticePaginatePayload
type Response = Either<HTTPException, Paginated<ManagementNoticeShowResponse>>

@inject()
export default class ManagementNoticePaginateUseCase {
  constructor(
    private readonly notices: NoticeRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      return right(
        await this.notices.paginate({
          page: payload.page ?? PAGINATION.PAGE,
          perPage: payload.perPage ?? PAGINATION.PER_PAGE,
          search: payload.search,
          status: payload.status,
          now: new Date(),
          sort: payload.sort ?? 'startsAt',
          direction: payload.direction ?? SORT_DIRECTION.DESC,
        }),
      )
    } catch (error) {
      logger.error({ err: error }, '[management/notices > paginate][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_NOTICE_PAGINATE_ERROR'),
      )
    }
  }
}
