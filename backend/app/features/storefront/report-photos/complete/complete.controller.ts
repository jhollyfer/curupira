import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

import StorefrontReportPhotoCompleteUseCase from './complete.use-case.ts'

import { defineDocs } from '#core/openapi/types'
import { IdentifierValidator } from '#core/validator'

@inject()
export default class StorefrontReportPhotoCompleteController {
  static docs = defineDocs({
    summary: 'Confirm a report photo upload',
    description:
      'Closes the upload: checks that what arrived has the declared size and really is the declared image type, **strips every embedded metadata** (EXIF, GPS, XMP) re-encoding the image, and only then marks it `UPLOADED` so a report can attach it.\n\n' +
      'The report location comes from the form pin, never from the photo: nothing in the stored file tells where it was taken.\n\n' +
      'A file that fails any check is deleted and responds `422`. Calling again on a confirmed photo is safe (`204`). Public, throttled per IP.',
    responses: { 204: 'no-content' },
    errors: {
      404: 'REPORT_PHOTO_NOT_FOUND',
      422: ['STORAGE_SIZE_MISMATCH', 'STORAGE_CONTENT_MISMATCH', 'REPORT_PHOTO_INVALID'],
    },
  })

  constructor(private readonly useCase: StorefrontReportPhotoCompleteUseCase) {}

  async handle(context: HttpContext) {
    const payload = await context.request.validateUsing(IdentifierValidator, {
      data: context.params,
    })
    const result = await this.useCase.execute(payload)
    if (result.isLeft()) throw result.value
    return context.response.noContent()
  }
}
