import { S3Client } from '@aws-sdk/client-s3'
import type { ApplicationService } from '@adonisjs/core/types'

import { clientConfig } from '#config/drive'
import { MultipartContract } from '#services/multipart/multipart.contract'
import MultipartService from '#services/multipart/multipart.service'
import { StorageContract } from '#services/storage/storage.contract'
import StorageService from '#services/storage/storage.service'
import { PhotoSanitizerContract } from '#services/photo-sanitizer/photo-sanitizer.contract'
import PhotoSanitizerService from '#services/photo-sanitizer/photo-sanitizer.service'
import { ProtocolContract } from '#services/protocol/protocol.contract'
import ProtocolService from '#services/protocol/protocol.service'

/**
 * The external I/O composition root: the S3 client, the photo sanitizer and the protocol
 * generator bound to the concrete ones (_standards/solid.md §2). The signed read URL is not born here:
 * the repository signs it through the `StorageContract` (_standards/backend.md §4.7).
 *
 * `singleton` for the client: it holds the HTTP connection pool, and one per request
 * would throw away keep-alive on every upload. The services are `bind`: stateless,
 * the container builds them per request.
 */
export default class StorageProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(S3Client, () => new S3Client(clientConfig))
    this.app.container.bind(StorageContract, () => this.app.container.make(StorageService))
    this.app.container.bind(MultipartContract, () => this.app.container.make(MultipartService))
    this.app.container.bind(PhotoSanitizerContract, () =>
      this.app.container.make(PhotoSanitizerService),
    )
    this.app.container.bind(ProtocolContract, () => this.app.container.make(ProtocolService))
  }

  async shutdown() {
    const client = await this.app.container.make(S3Client)

    client.destroy()
  }
}
