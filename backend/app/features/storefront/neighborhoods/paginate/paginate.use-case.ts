import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type Paginated,
  type StorefrontNeighborhoodShowResponse,
} from '@curupira/shared'

import { MemoryPagination } from '#core/memory-pagination'
import HTTPException from '#exceptions/http.exception'
import { NeighborhoodRepository } from '#repositories/neighborhood/neighborhood.repository'

type Response = Either<HTTPException, Paginated<StorefrontNeighborhoodShowResponse>>

@inject()
export default class StorefrontNeighborhoodPaginateUseCase {
  constructor(
    private readonly neighborhoods: NeighborhoodRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(): Promise<Response> {
    try {
      const all = await this.neighborhoods.listAll()

      // One page with everything: the envelope keeps the shape of every other listing, and
      // `perPage` is never zero (a lone empty city would otherwise divide by it).
      return right(MemoryPagination.slice(all, 1, Math.max(all.length, 1)))
    } catch (error) {
      logger.error({ err: error }, '[storefront/neighborhoods > paginate][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STOREFRONT_NEIGHBORHOOD_PAGINATE_ERROR',
        ),
      )
    }
  }
}
