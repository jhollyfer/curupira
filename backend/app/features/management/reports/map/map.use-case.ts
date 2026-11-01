import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementReportListItemResponse } from '@curupira/shared'

import { Instant } from '#core/instant'
import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'
import type { ManagementReportMapPayload } from '#validators/management/reports.validator'

type Payload = ManagementReportMapPayload
type Response = Either<HTTPException, ManagementReportListItemResponse[]>

@inject()
export default class ManagementReportMapUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      return right(
        await this.reports.pins({
          kind: payload.kind,
          status: payload.status,
          neighborhoodId: payload.neighborhoodId,
          from: Instant.optional(payload.from),
          to: Instant.optional(payload.to),
        }),
      )
    } catch (error) {
      logger.error({ err: error }, '[management/reports > map][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_REPORT_MAP_ERROR',
        ),
      )
    }
  }
}
