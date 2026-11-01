import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { left, right, type Either } from '@curupira/shared'

import HTTPException from '#exceptions/http.exception'
import { UserRepository } from '#repositories/user/user.repository'
import type { IdentifierPayload } from '#core/validator'

type Payload = IdentifierPayload
type Response = Either<HTTPException, null>

/**
 * Deletes the account for good. The own account does not pass through here: `UserPolicy`,
 * checked by the controller with `ctx.bouncer`, refuses it with `403` before any read, so
 * the last administrator can never delete themselves.
 *
 * No reference count: what points at `users` is `auth_access_tokens` (`CASCADE`, a
 * credential that must go along) and the report timeline author (`SET NULL`).
 */
@inject()
export default class ManagementUserDeleteUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly i18n: I18n,
  ) {}

  async execute({ id }: Payload): Promise<Response> {
    try {
      const user = await this.users.findById(id)
      if (!user)
        return left(HTTPException.NotFound(this.i18n.t('users.not_found'), 'USER_NOT_FOUND'))

      await this.users.delete(user)

      return right(null)
    } catch (error) {
      logger.error({ err: error }, '[management/users > delete][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_USER_DELETE_ERROR',
        ),
      )
    }
  }
}
