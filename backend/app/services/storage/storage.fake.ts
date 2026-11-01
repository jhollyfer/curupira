import {
  StorageContract,
  type StorageDownload,
  type StorageMetadata,
} from '#services/storage/storage.contract'

const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/**
 * The in-memory bucket, for the unit test. It honors the same contract as
 * `StorageService`: the test arranges what the bucket "received" with `put` and reads
 * what was deleted in `discarded`.
 */
export class StorageFake extends StorageContract {
  readonly discarded: string[] = []
  private readonly objects = new Map<string, StorageMetadata>()
  private readonly heads = new Map<string, Uint8Array>()
  private readonly bodies = new Map<string, Uint8Array>()
  /** What `overwrite` wrote, so a test can assert the stripped bytes replaced the original. */
  readonly overwritten = new Map<string, Uint8Array>()
  private keys = 0

  /**
   * Test arrangement: the object the client uploaded. Without `head`, the content is a
   * PNG, the type of the test files.
   */
  put(path: string, metadata: StorageMetadata, head: Uint8Array = PNG_HEAD): this {
    this.objects.set(path, metadata)
    this.heads.set(path, head)
    return this
  }

  /** Test arrangement: the whole body, for the cases that read it. */
  putBody(path: string, body: Uint8Array): this {
    this.bodies.set(path, body)
    return this
  }

  async read(path: string): Promise<Uint8Array> {
    const body = this.bodies.get(path)
    if (!body) throw new Error(`object body missing from the bucket: ${path}`)

    return body
  }

  async overwrite(path: string, bytes: Uint8Array): Promise<void> {
    this.overwritten.set(path, bytes)
    this.bodies.set(path, bytes)
  }

  async head(path: string): Promise<Uint8Array> {
    const head = this.heads.get(path)
    if (!head) throw new Error(`object missing from the bucket: ${path}`)

    return head
  }

  key(): string {
    this.keys += 1

    return `fake-${this.keys}.bin`
  }

  async metadata(path: string): Promise<StorageMetadata> {
    const metadata = this.objects.get(path)
    if (!metadata) throw new Error(`object missing from the bucket: ${path}`)

    return metadata
  }

  async discard(path: string): Promise<void> {
    this.discarded.push(path)
    this.objects.delete(path)
  }

  async signedUrl(path: string): Promise<string> {
    return `https://bucket.test/${path}?signed`
  }

  async signedDownload(file: StorageDownload): Promise<string> {
    return `https://bucket.test/${file.path}?download=${encodeURIComponent(file.originalName)}`
  }

  contentDisposition(originalName: string): string {
    return `attachment; filename="${originalName}"`
  }
}
