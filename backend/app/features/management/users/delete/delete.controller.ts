import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementUserDeleteUseCase from './delete.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import UserPolicy from '#policies/user.policy'
import { UserRepository } from '#repositories/user/user.repository'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementUserDeleteController {
  static docs = defineDocs({
    summary: 'Delete user',
    description:
      '**Irreversible**: deletes the account, and with it its tokens in `auth_access_tokens` by `CASCADE` - a token is a live credential, and leaving it behind would keep a session that nobody can revoke anymore.\n\n' +
      'The history the account wrote on reports stays, with no author. To only switch the access off, set `status` to `INACTIVE` on `PUT /management/users/:id`.\n\n' +
      'The **own** account responds `403`.',
    errors: { 403: 'SELF_DELETE_FORBIDDEN' },
  })

  constructor(private readonly useCase: ManagementUserDeleteUseCase,
    private readonly users: UserRepository) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const user = await this.users.findById(payload.id)
    await context.bouncer.with(UserPolicy).authorize('delete', user)
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
