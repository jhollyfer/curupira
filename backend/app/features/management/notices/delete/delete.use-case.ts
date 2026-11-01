import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either } from '@curupira/shared'

import { NoticeRefusal } from '../_shared.notice-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { NoticeRepository } from '#repositories/notice/notice.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

@inject()
export default class ManagementNoticeDeleteUseCase {
  constructor(
    private readonly notices: NoticeRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const notice = await this.notices.findById(id)
      if (!notice) return left(NoticeRefusal.notFound(this.i18n))

      await this.notices.delete(notice)

      return right(null)
    } catch (error) {
      logger.error({ err: error }, '[management/notices > delete][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_NOTICE_DELETE_ERROR'),
      )
    }
  }
}
