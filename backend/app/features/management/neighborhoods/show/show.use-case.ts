import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either, type ManagementNeighborhoodShowResponse } from '@curupira/shared'

import { NeighborhoodPresenter } from '../neighborhoods.presenter.ts'
import { NeighborhoodRefusal } from '../_shared.neighborhood-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, ManagementNeighborhoodShowResponse>

@inject()
export default class ManagementNeighborhoodShowUseCase {
  constructor(
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const neighborhood = await this.neighborhoods.findById(id)
      if (!neighborhood) return left(NeighborhoodRefusal.notFound(this.i18n))

      return right(NeighborhoodPresenter.show(neighborhood))
    } catch (error) {
      logger.error({ err: error }, '[management/neighborhoods > show][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_NEIGHBORHOOD_SHOW_ERROR',
        ),
      )
    }
  }
}
