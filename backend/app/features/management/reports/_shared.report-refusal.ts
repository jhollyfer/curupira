import type { I18n } from '@adonisjs/i18n'

import { RefusalBase, type RefusalTable } from '#features/_shared.refusal.base'
import HTTPException from '#exceptions/http.exception'
import type { ReportError } from '#domain/report/report.errors'

/** Each refusal of the report as an HTTP response (`_standards/domain.md` §2). */
export class ReportRefusal extends RefusalBase {
  private static readonly TABLE = {
    REPORT_STATUS_REGRESSION: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('reports.status_regression'),
        'REPORT_STATUS_REGRESSION',
        { status: i18n.t('reports.status_regression_field') },
      ),
    REPORT_PROTOCOL_TAKEN: (_fact, i18n) =>
      HTTPException.Conflict(
        i18n.t('reports.protocol_taken'),
        'REPORT_PROTOCOL_TAKEN',
      ),
    REPORT_PHOTO_TAKEN: (_fact, i18n) =>
      HTTPException.UnprocessableEntity(
        i18n.t('reports.photo_taken'),
        'REPORT_PHOTO_TAKEN',
        {
          photoIds: i18n.t('reports.photo_taken'),
        },
      ),
  } satisfies RefusalTable<ReportError>

  static http(error: ReportError, i18n: I18n): HTTPException {
    return ReportRefusal.translate(ReportRefusal.TABLE, error.code, error, i18n)
  }

  static notFound(i18n: I18n): HTTPException {
    return HTTPException.NotFound(
      i18n.t('reports.not_found'),
      'REPORT_NOT_FOUND',
    )
  }
}
