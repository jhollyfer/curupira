import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementReportShowUseCase from './show.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementReportShowController {
  static docs = defineDocs({
    summary: 'View a report',
    description:
      'The full report for the panel: description, contact (when the resident left one), photos with a short-lived signed `url`, and the whole timeline with who answered.\n\n' +
      'The contact is personal data and exists only here, behind the panel roles.',
  })

  constructor(private readonly useCase: ManagementReportShowUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
