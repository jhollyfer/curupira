import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementReportDeleteUseCase from './delete.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementReportDeleteController {
  static docs = defineDocs({
    summary: 'Delete a report',
    description:
      '**Irreversible**: removes the report, its timeline and its photos (row and binary). The protocol stops resolving on the public page.\n\n' +
      'Meant for spam and test reports; a handled report is kept and moved to RESOLVED.',
  })

  constructor(private readonly useCase: ManagementReportDeleteUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
