import {
  MultipartContract,
  type PartToSign,
  type PresignedPart,
  type UploadedPart,
} from '#services/multipart/multipart.contract'

/**
 * In-memory S3 multipart, for the unit test. It honors the contract of
 * `MultipartService`: it keeps the parts the test "sent" and records the
 * uploads opened, completed and aborted.
 */
export class MultipartFake extends MultipartContract {
  readonly initiated: string[] = []
  readonly completed: string[] = []
  readonly aborted: string[] = []
  /** The lifetime asked for each single-part URL, so a test can pin how long it stays valid. */
  readonly singleExpiries: Array<number | undefined> = []
  private readonly uploaded = new Map<string, UploadedPart[]>()

  /** Test arrangement: the parts the bucket has already received for this upload. */
  withUploaded(uploadId: string, parts: UploadedPart[]): this {
    this.uploaded.set(uploadId, parts)
    return this
  }

  async initiate(key: string): Promise<string> {
    this.initiated.push(key)

    return `upload-${key}`
  }

  async signParts(
    key: string,
    _uploadId: string,
    parts: ReadonlyArray<PartToSign>,
  ): Promise<Array<PresignedPart>> {
    return parts.map(({ partNumber }) => ({
      partNumber,
      url: `https://bucket.test/${key}?part=${partNumber}`,
    }))
  }

  async signSingle(
    key: string,
    _contentType?: string,
    _size?: number,
    expiresIn?: number,
  ): Promise<string> {
    this.singleExpiries.push(expiresIn)
    return `https://bucket.test/${key}?single`
  }

  async listParts(
    _key: string,
    uploadId: string,
  ): Promise<Array<UploadedPart>> {
    return this.uploaded.get(uploadId) ?? []
  }

  async complete(key: string): Promise<void> {
    this.completed.push(key)
  }

  async abort(key: string): Promise<void> {
    this.aborted.push(key)
  }
}
