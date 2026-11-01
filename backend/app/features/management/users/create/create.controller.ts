import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementUserCreateUseCase from './create.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { ManagementUserCreateValidator } from '#validators/management/users.validator'

@inject()
export default class ManagementUserCreateController {
  static docs = defineDocs({
    summary: 'Create user',
    description:
      'Returns `201` with the created account, bare object, without envelope and **without the password**.\n\n' +
      'The only way to create a user in the API: there is no public sign-up, and the first owner comes from the seeder.\n\n' +
      '`role` is required - the role is always explicit on the server. `password` requires `passwordConfirmation` with the same value.\n\n' +
      'The email of another account responds `409`.',
    errors: { 409: 'USER_ALREADY_EXISTS' },
  })

  constructor(private readonly useCase: ManagementUserCreateUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(ManagementUserCreateValidator)
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.created(result.value)
  }
}
