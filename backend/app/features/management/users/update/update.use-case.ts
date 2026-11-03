import { inject } from '@adonisjs/core'
import { I18n } from '@adonisjs/i18n'
import logger from '@adonisjs/core/services/logger'
import {
  left,
  right,
  type Either,
  type ManagementUserShowResponse,
  type Merge,
} from '@curupira/shared'

import { UserRefusal } from '../_shared.user-refusal.ts'

import HTTPException from '#exceptions/http.exception'
import { SessionRepository } from '#repositories/session/session.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { UserRepository } from '#repositories/user/user.repository'
import type { IdentifierPayload } from '#core/validator'
import type { ManagementUserUpdatePayload } from '#validators/management/users.validator'

type Payload = Merge<ManagementUserUpdatePayload, IdentifierPayload>
type Response = Either<HTTPException, ManagementUserShowResponse>

/** Edits the account. A missing field means "leave alone"; role and status on the own account are refused by the policy. */
@inject()
export default class ManagementUserUpdateUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly i18n: I18n,
  ) {}

  async execute({ id, ...changes }: Payload): Promise<Response> {
    try {
      const user = await this.users.findById(id)
      if (!user)
        return left(
          HTTPException.NotFound(
            this.i18n.t('users.not_found'),
            'USER_NOT_FOUND',
          ),
        )

      if (
        changes.email &&
        changes.email !== user.snapshot().email &&
        (await this.users.existsByEmail(changes.email, id))
      )
        return left(
          UserRefusal.http({ code: 'USER_ALREADY_EXISTS' }, this.i18n),
        )

      // Changing email or password, changing the role and deactivating the account drop the
      // target sessions: the entity says what the edit obliges to do.
      const effects = user.update(changes, new Date())

      // Saving and dropping the sessions land together: apart, the failure of one would leave
      // the account changed with a session of the old access. The email check above does not
      // close the race: `save` returns the same fact when the database `unique` loses it.
      const written = await this.unitOfWork.run(
        async (): Promise<Either<HTTPException, null>> => {
          const saved = await this.users.save(user)
          if (saved.isLeft())
            return left(UserRefusal.http(saved.value, this.i18n))

          if (effects.revokesSessions) await this.sessions.revokeAll(id)

          return right(null)
        },
      )
      if (written.isLeft()) return left(written.value)

      const detail = await this.users.detail(id)
      if (!detail)
        return left(
          HTTPException.NotFound(
            this.i18n.t('users.not_found'),
            'USER_NOT_FOUND',
          ),
        )

      return right(detail)
    } catch (error) {
      logger.error({ err: error }, '[management/users > update][error]')

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'MANAGEMENT_USER_UPDATE_ERROR',
        ),
      )
    }
  }
}
