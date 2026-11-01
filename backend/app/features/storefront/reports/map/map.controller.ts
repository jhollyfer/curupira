import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontReportMapUseCase from './map.use-case.ts'

import { defineDocs } from '#core/openapi/types'

@inject()
export default class StorefrontReportMapController {
  static docs = defineDocs({
    summary: 'Public report map',
    description:
      'The pins of the public map: only reports already looked at (IN_REVIEW, FORWARDED, RESOLVED), so a hoax or a misplaced pin never shows before someone reviewed it.\n\n' +
      'Each pin carries the kind, status, coordinates **rounded to about 110 m** and the **day** (no hour). The newest 500 only. No text, no contact, no protocol, no photo. Public.',
  })

  constructor(private readonly useCase: StorefrontReportMapUseCase) {}

  async handle(context: HttpContext) {
    const result = await this.useCase.execute()
    if (result.isLeft()) throw result.value
    return context.response.ok(result.value)
  }
}
