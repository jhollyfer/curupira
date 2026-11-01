import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementReportShowResponse } from '@curupira/shared'

import { ReportPresenter } from '../reports.presenter.ts'
import { ReportRefusal } from '../_shared.report-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'
import { StorageContract } from '#services/storage/storage.contract'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, ManagementReportShowResponse>

@inject()
export default class ManagementReportShowUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly bucket: StorageContract,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const read = await this.reports.detail(id)
      if (!read) return left(ReportRefusal.notFound(this.i18n))

      return right(await ReportPresenter.show(read, this.bucket))
    } catch (error) {
      logger.error({ err: error }, '[management/reports > show][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_REPORT_SHOW_ERROR'),
      )
    }
  }
}
