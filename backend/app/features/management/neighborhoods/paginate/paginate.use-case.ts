import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  PAGINATION,
  left,
  right,
  type Either,
  type ManagementNeighborhoodShowResponse,
  type Paginated,
} from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'
import { sortOrder } from '#features/_shared.sort'
import type { ManagementNeighborhoodPaginatePayload } from '#validators/management/neighborhoods.validator'

type Payload = ManagementNeighborhoodPaginatePayload
type Response = Either<HTTPException, Paginated<ManagementNeighborhoodShowResponse>>

@inject()
export default class ManagementNeighborhoodPaginateUseCase {
  constructor(
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const [sort, direction] = sortOrder(payload, 'name')

      return right(
        await this.neighborhoods.paginate({
          page: payload.page ?? PAGINATION.PAGE,
          perPage: payload.perPage ?? PAGINATION.PER_PAGE,
          search: payload.search,
          sort,
          direction,
        }),
      )
    } catch (error) {
      logger.error({ err: error }, '[management/neighborhoods > paginate][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_NEIGHBORHOOD_PAGINATE_ERROR'),
      )
    }
  }
}
