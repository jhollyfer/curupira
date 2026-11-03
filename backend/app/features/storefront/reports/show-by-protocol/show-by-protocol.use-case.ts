import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  PROTOCOL_PATTERN,
  left,
  right,
  type Either,
  type StorefrontReportShowByProtocolResponse,
} from '@curupira/shared'

import { ReportRefusal } from '#features/management/reports/_shared.report-refusal'
import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'
import type { StorefrontReportShowByProtocolPayload } from '#validators/storefront/reports.validator'

type Payload = StorefrontReportShowByProtocolPayload
type Response = Either<HTTPException, StorefrontReportShowByProtocolResponse>

/**
 * The public status page. The repository method selects the public columns only, so this
 * use case cannot leak a private field by forgetting to omit it.
 */
@inject()
export default class StorefrontReportShowByProtocolUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      // The validator brought the protocol to the canonical shape; one that still does not fit
      // can match no report, and answers like an unknown one so nothing is learned from the shape.
      if (!PROTOCOL_PATTERN.test(payload.protocol))
        return left(ReportRefusal.notFound(this.i18n))

      const report = await this.reports.showByProtocol(payload.protocol)
      if (!report) return left(ReportRefusal.notFound(this.i18n))

      return right(report)
    } catch (error) {
      logger.error(
        { err: error },
        '[storefront/reports > show-by-protocol][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_REPORT_SHOW_BY_PROTOCOL_ERROR',
        ),
      )
    }
  }
}
