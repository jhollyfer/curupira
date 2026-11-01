import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNoticeDeleteUseCase from './delete.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementNoticeDeleteController {
  static docs = defineDocs({
    summary: 'Delete notice',
    description:
      '**Irreversible**: removes the notice. To take it off the home keeping the record, close it instead.',
  })

  constructor(private readonly useCase: ManagementNoticeDeleteUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
