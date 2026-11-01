import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type StorefrontReportMapResponse } from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'

type Response = Either<HTTPException, StorefrontReportMapResponse[]>

@inject()
export default class StorefrontReportMapUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      return right(await this.reports.publicMap())
    } catch (error) {
      logger.error({ err: error }, '[storefront/reports > map][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_REPORT_MAP_ERROR',
        ),
      )
    }
  }
}
