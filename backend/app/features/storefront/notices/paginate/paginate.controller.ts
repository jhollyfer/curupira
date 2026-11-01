import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontNoticePaginateUseCase from './paginate.use-case.ts'

import { defineDocs } from '#core/openapi/types'

@inject()
export default class StorefrontNoticePaginateController {
  static docs = defineDocs({
    summary: 'Active notices',
    description:
      'The notices showing right now (status ACTIVE), the most recent start first. Scheduled and closed ones never appear here. Public.',
  })

  constructor(private readonly useCase: StorefrontNoticePaginateUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
