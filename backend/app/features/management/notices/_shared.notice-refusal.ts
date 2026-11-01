import type { I18n } from '@adonisjs/i18n'

import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'
import HTTPException from '#exceptions/http.exception'
import type { NoticeError } from '#domain/notice/notice.errors'

/** Each refusal of the notice as an HTTP response (`_standards/domain.md` §2). */
export class NoticeRefusal extends RefusalBase {
  private static readonly TABLE = {
    NOTICE_INVALID_PERIOD: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(i18n.t('notices.invalid_period'), 'NOTICE_INVALID_PERIOD', {
        endsAt: i18n.t('notices.ends_before_start'),
      }),
    NOTICE_ALREADY_CLOSED: (_fact, i18n) =>
      HTTPException.Conflict(i18n.t('notices.already_closed'), 'NOTICE_ALREADY_CLOSED'),
  } satisfies RefusalTable<NoticeError>

  static http(error: NoticeError, i18n: I18n): HTTPException {
    return NoticeRefusal.translate(NoticeRefusal.TABLE, error.code, error, i18n)
  }

  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(i18n.t('notices.not_found'), 'NOTICE_NOT_FOUND')
  }
}
