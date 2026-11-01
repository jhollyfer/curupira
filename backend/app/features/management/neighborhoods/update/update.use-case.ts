import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  Slug,
  left,
  right,
  type Either,
  type ManagementNeighborhoodShowResponse,
  type Merge,
} from '@curupira/shared'

import { NeighborhoodPresenter } from '../neighborhoods.presenter.ts'
import { NeighborhoodRefusal } from '../_shared.neighborhood-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import type { IdentifierPayload } from '#core/validator'
import type { ManagementNeighborhoodUpdatePayload } from '#validators/management/neighborhoods.validator'

type Payload = Merge<ManagementNeighborhoodUpdatePayload, IdentifierPayload>
type Response = Either<HTTPException, ManagementNeighborhoodShowResponse>

/** Renames and moves the center. A missing field means "leave alone". */
@inject()
export default class ManagementNeighborhoodUpdateUseCase {
  constructor(
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id, ...changes }: Payload): Promise<Response> {
    try {
      const neighborhood = await this.neighborhoods.findById(id)
      if (!neighborhood) return left(NeighborhoodRefusal.notFound(this.i18n))

      if (
        neighborhood.renamesTo(changes.name) &&
        (await this.neighborhoods.existsByNameOrSlug(
          changes.name,
          Slug.from(changes.name).value,
          id,
        ))
      )
        return left(NeighborhoodRefusal.http({ code: 'NEIGHBORHOOD_ALREADY_EXISTS' }, this.i18n))

      const updated = neighborhood.update(changes, new Date())
      if (updated.isLeft()) return left(NeighborhoodRefusal.http(updated.value, this.i18n))

      const saved = await this.neighborhoods.save(neighborhood)
      if (saved.isLeft()) return left(NeighborhoodRefusal.http(saved.value, this.i18n))

      return right(NeighborhoodPresenter.show(neighborhood))
    } catch (error) {
      logger.error({ err: error }, '[management/neighborhoods > update][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_NEIGHBORHOOD_UPDATE_ERROR',
        ),
      )
    }
  }
}
