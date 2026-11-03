import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type ManagementUserShowResponse,
} from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { UserRepository } from '#repositories/user/user.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, ManagementUserShowResponse>

@inject()
export default class ManagementUserShowUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const user = await this.users.detail(id)
      if (!user)
        return left(
          HTTPException.NotFound(
            this.i18n.t('users.not_found'),
            'USER_NOT_FOUND',
          ),
        )

      return right(user)
    } catch (error) {
      logger.error({ err: error }, '[management/users > show][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_USER_SHOW_ERROR',
        ),
      )
    }
  }
}
