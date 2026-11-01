import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  PAGINATION,
  left,
  right,
  type Either,
  type ManagementReportListItemResponse,
  type Paginated,
} from '@curupira/shared'

import { Instant } from '#core/instant'
import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'
import { recentFirst } from '#features/_shared.sort'
import type { ManagementReportPaginatePayload } from '#validators/management/reports.validator'

type Payload = ManagementReportPaginatePayload
type Response = Either<HTTPException, Paginated<ManagementReportListItemResponse>>

@inject()
export default class ManagementReportPaginateUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const [sort, direction] = recentFirst(payload)

      return right(
        await this.reports.paginate({
          page: payload.page ?? PAGINATION.PAGE,
          perPage: payload.perPage ?? PAGINATION.PER_PAGE,
          search: payload.search,
          kind: payload.kind,
          status: payload.status,
          neighborhoodId: payload.neighborhoodId,
          from: Instant.optional(payload.from),
          to: Instant.optional(payload.to),
          sort,
          direction,
        }),
      )
    } catch (error) {
      logger.error({ err: error }, '[management/reports > paginate][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_REPORT_PAGINATE_ERROR',
        ),
      )
    }
  }
}
