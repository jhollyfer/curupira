import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import { randomUUID } from 'node:crypto'

import { left, right, type Either, type ManagementUserShowResponse } from '@curupira/shared'

import { UserRefusal } from '../_shared.user-refusal.ts'

import { User } from '#domain/user/user.entity'
import HTTPException from '#exceptions/http.exception'
import { UserRepository } from '#repositories/user/user.repository'
import type { ManagementUserCreatePayload } from '#validators/management/users.validator'

type Payload = ManagementUserCreatePayload
type Response = Either<HTTPException, ManagementUserShowResponse>

/**
 * Creates the account. The only way to create a user in the API - there is no public
 * sign-up -, and so the role always comes explicit in the payload.
 *
 * The password comes in plain text and goes out hashed: the persistence does the hashing
 * (model hook). Passing the hash from here would produce a hash of a hash and no login
 * would work.
 */
@inject()
export default class ManagementUserCreateUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    try {
      if (await this.users.existsByEmail(payload.email))
        return left(UserRefusal.http({ code: 'USER_ALREADY_EXISTS' }, this.i18n))

      const user = User.create({ id: randomUUID(), ...payload, now: new Date() })

      const saved = await this.users.save(user)
      if (saved.isLeft()) return left(UserRefusal.http(saved.value, this.i18n))

      // Reload before responding: `status` comes from the entity default and the response
      // is the row as it ended up, without the password.
      const detail = await this.users.detail(user.id)
      if (!detail) return left(HTTPException.NotFound(this.i18n.t('users.not_found'), 'USER_NOT_FOUND'))

      return right(detail)
    } catch (error) {
      logger.error({ err: error }, '[management/users > create][error]')

      return left(
        HTTPException.InternalServerError(this.i18n.t('errors.internal'), 'MANAGEMENT_USER_CREATE_ERROR'),
      )
    }
  }
}
