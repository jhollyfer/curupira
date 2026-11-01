import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNeighborhoodShowUseCase from './show.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementNeighborhoodShowController {
  static docs = defineDocs({
    summary: 'View a neighborhood',
    description:
      'Returns the bare object, without envelope.',
  })

  constructor(private readonly useCase: ManagementNeighborhoodShowUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
