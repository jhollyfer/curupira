import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Actor,
  type AccountProfileShowResponse,
  type Either,
} from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { UserRepository } from '#repositories/user/user.repository'

type Payload = { actor: Actor }
type Response = Either<HTTPException, AccountProfileShowResponse>

/**
 * Reading the own account: the session `actor` (_standards/backend.md §4.3).
 *
 * The guard already read the account in this request, with the inactive filter -
 * whoever was deactivated does not get here. What is read again is the response shape.
 */
@inject()
export default class AccountProfileShowUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ actor }: Payload): Promise<Response> {
    try {
      const profile = await this.users.detail(actor.id)

      if (!profile)
        return left(
          HTTPException.NotFound(
            this.i18n.t('users.not_found'),
            'USER_NOT_FOUND',
          ),
        )

      return right(profile)
    } catch (error) {
      logger.error({ err: error }, '[account/profile > show][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'ACCOUNT_PROFILE_SHOW_ERROR',
        ),
      )
    }
  }
}
