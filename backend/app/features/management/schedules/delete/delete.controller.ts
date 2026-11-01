import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementScheduleDeleteUseCase from './delete.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementScheduleDeleteController {
  static docs = defineDocs({
    summary: 'Delete collection slot',
    description:
      'Deletes the slot. Residents stop seeing that collection on the next read.',
  })

  constructor(private readonly useCase: ManagementScheduleDeleteUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
