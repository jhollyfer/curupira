import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementReportStatsResponse } from '@curupira/shared'

import { ReportPresenter, STATS_DAYS } from '../reports.presenter.ts'

import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'

type Response = Either<HTTPException, ManagementReportStatsResponse>

@inject()
export default class ManagementReportStatsUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      const now = new Date()
      // One day more than the series shows, so the earliest local day is never cut at midnight UTC.
      const since = new Date(now.getTime() - (STATS_DAYS + 1) * 24 * 60 * 60 * 1000)

      return right(ReportPresenter.stats(await this.reports.statistics(since), now))
    } catch (error) {
      logger.error({ err: error }, '[management/reports > stats][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_REPORT_STATS_ERROR',
        ),
      )
    }
  }
}
