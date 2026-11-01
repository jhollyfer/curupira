import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either } from '@curupira/shared'

import { ReportRefusal } from '../_shared.report-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { StorageContract } from '#services/storage/storage.contract'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

/** Deletes the report and, after it, the photos it owned. */
@inject()
export default class ManagementReportDeleteUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly storages: StorageRepository,
    private readonly bucket: StorageContract,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const report = await this.reports.findById(id)
      if (!report) return left(ReportRefusal.notFound(this.i18n))

      const photoIds = await this.reports.photoStorageIds(id)
      await this.reports.delete(report)

      // After the report: the photo link is `RESTRICT`, so the file rows only become deletable
      // once the report (and with it the link) is gone. A failure here leaves an orphan file
      // that `storages:prune` and the library already know how to find, never a report that
      // half-exists.
      for (const photoId of photoIds) {
        const storage = await this.storages.findById(photoId)
        if (!storage) continue

        await this.bucket.discard(storage.snapshot().path)
        await this.storages.delete(storage)
      }

      return right(null)
    } catch (error) {
      logger.error({ err: error }, '[management/reports > delete][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_REPORT_DELETE_ERROR',
        ),
      )
    }
  }
}
