import { PhotoSanitizerContract } from '#services/photo-sanitizer/photo-sanitizer.contract'

/**
 * The deterministic sanitizer for the unit test: "strips" by prefixing a marker, so the
 * spec can assert the bytes that reached the bucket are the sanitized ones and not the
 * original. `refuse()` makes the next call answer `null`, as a corrupt image would.
 */
export class PhotoSanitizerFake extends PhotoSanitizerContract {
  static readonly MARKER = new TextEncoder().encode('STRIPPED:')
  readonly received: Array<{
    readonly mimetype: string
    readonly bytes: Uint8Array
  }> = []
  private refusing = false

  refuse(): this {
    this.refusing = true
    return this
  }

  async strip(mimetype: string, bytes: Uint8Array): Promise<Uint8Array | null> {
    this.received.push({ mimetype, bytes })
    if (this.refusing) return null

    return new Uint8Array([...PhotoSanitizerFake.MARKER, ...bytes])
  }
}
