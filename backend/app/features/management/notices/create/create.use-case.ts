import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementNoticeShowResponse } from '@curupira/shared'

import { NoticePresenter } from '../notices.presenter.ts'
import { NoticeRefusal } from '../_shared.notice-refusal.ts'

import { Instant } from '#core/instant'
import { Notice } from '#domain/notice/notice.entity'
import HTTPException from '#exceptions/http.exception'
import { NoticeRepository } from '#repositories/notice/notice.repository'
import type { ManagementNoticeCreatePayload } from '#validators/management/notices.validator'

type Payload = ManagementNoticeCreatePayload
type Response = Either<HTTPException, ManagementNoticeShowResponse>

/** Publishes the notice: the entity checks the period. */
@inject()
export default class ManagementNoticeCreateUseCase {
  constructor(
    private readonly notices: NoticeRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const now = new Date()
      const created = Notice.create({
        id: randomUUID(),
        title: payload.title,
        body: payload.body,
        startsAt: new Date(payload.startsAt),
        endsAt: Instant.parse(payload.endsAt) ?? null,
        now,
      })
      if (created.isLeft()) return left(NoticeRefusal.http(created.value, this.i18n))

      await this.notices.save(created.value)

      return right(NoticePresenter.show(created.value, now))
    } catch (error) {
      logger.error({ err: error }, '[management/notices > create][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_NOTICE_CREATE_ERROR',
        ),
      )
    }
  }
}
