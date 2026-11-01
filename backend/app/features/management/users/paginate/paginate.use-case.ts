import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  PAGINATION,
  left,
  right,
  type Either,
  type ManagementUserShowResponse,
  type Paginated,
} from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { UserRepository } from '#repositories/user/user.repository'
import { sortOrder } from '#features/_shared.sort'
import type { ManagementUserPaginatePayload } from '#validators/management/users.validator'

type Payload = ManagementUserPaginatePayload
type Response = Either<HTTPException, Paginated<ManagementUserShowResponse>>

@inject()
export default class ManagementUserPaginateUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      const [sort, direction] = sortOrder(payload, 'name')

      return right(
        await this.users.paginate({
          page: payload.page ?? PAGINATION.PAGE,
          perPage: payload.perPage ?? PAGINATION.PER_PAGE,
          search: payload.search,
          role: payload.role,
          status: payload.status,
          sort,
          direction,
        }),
      )
    } catch (error) {
      logger.error({ err: error }, '[management/users > paginate][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_USER_PAGINATE_ERROR',
        ),
      )
    }
  }
}
