import sharp, { type Sharp } from 'sharp'

import { Semaphore } from '#core/semaphore'
import { PhotoSanitizerContract } from '#services/photo-sanitizer/photo-sanitizer.contract'

/**
 * Re-encodes the photo through `sharp` to drop its metadata.
 *
 * The phone writes the exact GPS position into the EXIF, and a report is anonymous: the
 * coordinates must come from the form pin, and nothing in the stored file may tell where
 * (or with which device) the photo was taken. `sharp` drops metadata by default on output
 * (no `withMetadata()` here, on purpose); `rotate()` with no argument applies the EXIF
 * orientation first, otherwise removing the tag would leave the picture sideways.
 *
 * `limitInputPixels` bounds the decode: a tiny file can declare a gigantic canvas (a
 * decompression bomb) and the route is anonymous. `failOn: 'error'` refuses a truncated
 * image instead of repairing it silently.
 */
export default class PhotoSanitizerService extends PhotoSanitizerContract {
  /**
   * 50 MP, not lower: current phones shoot 48 MP in full-resolution mode (8000x6000) and a
   * resident may well send that file, so a ceiling at 25 MP would refuse ordinary photos.
   * It is still below what a bomb needs: a decoded 50 MP canvas is about 150 MB, which the
   * concurrency ceiling below multiplies by two, not by the number of callers.
   */
  private static readonly MAX_PIXELS = 50_000_000

  /** Photos decoded at the same time; the rest wait their turn instead of piling canvases in memory. */
  private static readonly MAX_CONCURRENT = 2

  private static readonly gate = new Semaphore(
    PhotoSanitizerService.MAX_CONCURRENT,
  )

  static {
    // libvips threads per operation: two photos at once with every core each would still
    // starve the request loop of the API that serves the panel.
    sharp.concurrency(PhotoSanitizerService.MAX_CONCURRENT)
  }

  async strip(mimetype: string, bytes: Uint8Array): Promise<Uint8Array | null> {
    return PhotoSanitizerService.gate.run(() => this.reencode(mimetype, bytes))
  }

  private async reencode(
    mimetype: string,
    bytes: Uint8Array,
  ): Promise<Uint8Array | null> {
    try {
      const image = sharp(bytes, {
        limitInputPixels: PhotoSanitizerService.MAX_PIXELS,
        failOn: 'error',
      }).rotate()

      return new Uint8Array(
        await PhotoSanitizerService.encode(image, mimetype).toBuffer(),
      )
    } catch {
      // The decoder refusing the bytes is the answer, not a failure of ours: the caller
      // turns `null` into a 422 for the resident.
      return null
    }
  }

  private static encode(image: Sharp, mimetype: string): Sharp {
    const encoders: Record<string, (pipeline: Sharp) => Sharp> = {
      'image/jpeg': (pipeline) => pipeline.jpeg({ quality: 90 }),
      'image/png': (pipeline) => pipeline.png(),
      'image/webp': (pipeline) => pipeline.webp({ quality: 90 }),
    }
    const encoder = encoders[mimetype]
    if (!encoder) throw new Error(`no encoder for ${mimetype}`)

    return encoder(image)
  }
}
