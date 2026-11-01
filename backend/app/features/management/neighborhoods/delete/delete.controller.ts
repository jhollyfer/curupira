import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNeighborhoodDeleteUseCase from './delete.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementNeighborhoodDeleteController {
  static docs = defineDocs({
    summary: 'Delete neighborhood',
    description:
      'Deletes the neighborhood. One that still has collection slots responds `409`: deleting it would erase the schedule residents read - remove or move the slots first.\n\n' +
      'Reports filed under it are kept, with no neighborhood.',
    errors: { 409: 'NEIGHBORHOOD_IN_USE' },
  })

  constructor(private readonly useCase: ManagementNeighborhoodDeleteUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
