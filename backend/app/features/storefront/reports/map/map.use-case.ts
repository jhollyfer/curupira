import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type StorefrontReportMapResponse } from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { ReportRepository } from '#repositories/report/report.repository'

type Response = Either<HTTPException, StorefrontReportMapResponse[]>

/** The newest pins the anonymous map answers with; older ones leave the map before the response gets heavy. */
const PUBLIC_PIN_LIMIT = 500

/**
 * 3 decimals is about 110 m. The panel needs the exact spot to send a crew; the public
 * map only needs the neighborhood, and the exact coordinate of a report filed from a
 * house would point at the person who filed it.
 */
const COORDINATE_FACTOR = 1000

/**
 * The public map. The coordinates leave rounded to about 110 m; `management/reports/map`
 * keeps the exact ones, because the crew needs the spot.
 */
@inject()
export default class StorefrontReportMapUseCase {
  constructor(
    private readonly reports: ReportRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      const pins = await this.reports.publicMap(PUBLIC_PIN_LIMIT)

      return right(
        pins.map((pin) => ({
          ...pin,
          latitude: this.blur(pin.latitude),
          longitude: this.blur(pin.longitude),
        })),
      )
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

  private blur(coordinate: number): number {
    return Math.round(coordinate * COORDINATE_FACTOR) / COORDINATE_FACTOR
  }
}
