import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Actor,
  type Either,
  type ManagementReportShowResponse,
  type Merge,
} from '@curupira/shared'

import { ReportPresenter } from '../reports.presenter.ts'
import { ReportRefusal } from '../_shared.report-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { StorageContract } from '#services/storage/storage.contract'
import type { IdentifierPayload } from '#core/validator'
import type { ManagementReportUpdateStatusPayload } from '#validators/management/reports.validator'

type Payload = Merge<
  Merge<ManagementReportUpdateStatusPayload, IdentifierPayload>,
  { actor: Actor }
>
type Response = Either<HTTPException, ManagementReportShowResponse>

/** Moves the status forward and records who did it and what they told the resident. */
@inject()
export default class ManagementReportUpdateStatusUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly bucket: StorageContract,
    private readonly i18n: I18n,
  ) {}

  async execute({ id, status, message, actor }: Payload): Promise<Response> {
    try {
      const report = await this.reports.findById(id)
      if (!report) return left(ReportRefusal.notFound(this.i18n))

      const advanced = report.advance(
        { eventId: randomUUID(), status, message, authorId: actor.id },
        new Date(),
      )
      if (advanced.isLeft())
        return left(ReportRefusal.http(advanced.value, this.i18n))

      // The report row and its new event land together: apart, a failure would leave the
      // status moved with no line in the timeline the resident reads.
      const written = await this.unitOfWork.run(
        async (): Promise<Either<HTTPException, null>> => {
          const saved = await this.reports.save(report)
          if (saved.isLeft())
            return left(ReportRefusal.http(saved.value, this.i18n))

          return right(null)
        },
      )
      if (written.isLeft()) return left(written.value)

      const read = await this.reports.detail(id)
      if (!read) return left(ReportRefusal.notFound(this.i18n))

      return right(await ReportPresenter.show(read, this.bucket))
    } catch (error) {
      logger.error(
        { err: error },
        '[management/reports > update-status][error]',
      )

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_REPORT_UPDATE_STATUS_ERROR',
        ),
      )
    }
  }
}
