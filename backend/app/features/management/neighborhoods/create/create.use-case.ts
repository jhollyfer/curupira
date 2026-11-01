import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { randomUUID } from 'node:crypto'

import { left, right, type Either, type ManagementNeighborhoodShowResponse } from '@curupira/shared'

import { NeighborhoodPresenter } from '../neighborhoods.presenter.ts'
import { NeighborhoodRefusal } from '../_shared.neighborhood-refusal.ts'

import { Neighborhood } from '#domain/neighborhood/neighborhood.entity'
import HTTPException from '#exceptions/http.exception'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import type { ManagementNeighborhoodCreatePayload } from '#validators/management/neighborhoods.validator'

type Payload = ManagementNeighborhoodCreatePayload
type Response = Either<HTTPException, ManagementNeighborhoodShowResponse>

/** Registers the neighborhood: the entity checks the center, the repository the uniqueness. */
@inject()
export default class ManagementNeighborhoodCreateUseCase {
  constructor(
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const created = Neighborhood.create({ id: randomUUID(), ...payload, now: new Date() })
      if (created.isLeft()) return left(NeighborhoodRefusal.http(created.value, this.i18n))

      const neighborhood = created.value
      if (await this.neighborhoods.existsByNameOrSlug(payload.name, neighborhood.snapshot().slug))
        return left(NeighborhoodRefusal.http({ code: 'NEIGHBORHOOD_ALREADY_EXISTS' }, this.i18n))

      const saved = await this.neighborhoods.save(neighborhood)
      if (saved.isLeft()) return left(NeighborhoodRefusal.http(saved.value, this.i18n))

      return right(NeighborhoodPresenter.show(neighborhood))
    } catch (error) {
      logger.error({ err: error }, '[management/neighborhoods > create][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_NEIGHBORHOOD_CREATE_ERROR',
        ),
      )
    }
  }
}
