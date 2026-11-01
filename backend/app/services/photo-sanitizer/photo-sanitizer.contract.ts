/**
 * The report photo sanitizer contract (_standards/solid.md §2): image processing is
 * external I/O (a native library), so the use case depends on this, the provider binds
 * the implementation, and the unit test passes the `PhotoSanitizerFake`.
 *
 * `abstract class` and not `type`: it serves as a container token and as a type at the
 * same time. The concrete one is `PhotoSanitizerService`, bound in
 * `providers/storage.provider.ts`.
 */
export abstract class PhotoSanitizerContract {
  /**
   * The same image without any embedded metadata (EXIF, GPS, XMP, ICC comments), already
   * rotated to its visual orientation so dropping the orientation tag does not turn a
   * portrait photo sideways. `null` when the bytes are not a decodable image of the
   * declared type: a file that only starts like a JPEG is not a photo.
   */
  abstract strip(mimetype: string, bytes: Uint8Array): Promise<Uint8Array | null>
}
