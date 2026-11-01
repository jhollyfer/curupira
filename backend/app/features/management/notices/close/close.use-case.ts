import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementNoticeShowResponse } from '@curupira/shared'

import { NoticePresenter } from '../notices.presenter.ts'
import { NoticeRefusal } from '../_shared.notice-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { NoticeRepository } from '#repositories/notice/notice.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, ManagementNoticeShowResponse>

/** Closes the notice by hand, stamping `closedAt`. */
@inject()
export default class ManagementNoticeCloseUseCase {
  constructor(
    private readonly notices: NoticeRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const notice = await this.notices.findById(id)
      if (!notice) return left(NoticeRefusal.notFound(this.i18n))

      const now = new Date()
      const closed = notice.close(now)
      if (closed.isLeft()) return left(NoticeRefusal.http(closed.value, this.i18n))

      await this.notices.save(notice)

      return right(NoticePresenter.show(notice, now))
    } catch (error) {
      logger.error({ err: error }, '[management/notices > close][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_NOTICE_CLOSE_ERROR'),
      )
    }
  }
}
