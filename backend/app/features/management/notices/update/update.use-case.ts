import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementNoticeShowResponse, type Merge } from '@curupira/shared'

import { NoticePresenter } from '../notices.presenter.ts'
import { NoticeRefusal } from '../_shared.notice-refusal.ts'

import { Instant } from '#core/instant'
import HTTPException from '#exceptions/http.exception'
import { NoticeRepository } from '#repositories/notice/notice.repository'
import type { IdentifierPayload } from '#core/validator'
import type { ManagementNoticeUpdatePayload } from '#validators/management/notices.validator'

type Payload = Merge<ManagementNoticeUpdatePayload, IdentifierPayload>
type Response = Either<HTTPException, ManagementNoticeShowResponse>

/** Edits the notice. A missing field means "leave alone"; `null` on `endsAt` removes the end. */
@inject()
export default class ManagementNoticeUpdateUseCase {
  constructor(
    private readonly notices: NoticeRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id, ...changes }: Payload): Promise<Response> {
    try {
      const notice = await this.notices.findById(id)
      if (!notice) return left(NoticeRefusal.notFound(this.i18n))

      const now = new Date()
      const updated = notice.update(
        {
          title: changes.title,
          body: changes.body,
          startsAt: Instant.optional(changes.startsAt),
          endsAt: Instant.parse(changes.endsAt),
        },
        now,
      )
      if (updated.isLeft()) return left(NoticeRefusal.http(updated.value, this.i18n))

      await this.notices.save(notice)

      return right(NoticePresenter.show(notice, now))
    } catch (error) {
      logger.error({ err: error }, '[management/notices > update][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_NOTICE_UPDATE_ERROR'),
      )
    }
  }
}
