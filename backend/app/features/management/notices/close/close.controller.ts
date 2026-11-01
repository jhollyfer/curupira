import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import ManagementNoticeCloseUseCase from './close.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class ManagementNoticeCloseController {
  static docs = defineDocs({
    summary: 'Close notice',
    description:
      'Ends the showing now: the notice leaves the home immediately and its status becomes `CLOSED`. It stays in the panel list.\n\n' +
      'Closing twice responds `409`.',
    errors: { 409: 'NOTICE_ALREADY_CLOSED' },
  })

  constructor(private readonly useCase: ManagementNoticeCloseUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
