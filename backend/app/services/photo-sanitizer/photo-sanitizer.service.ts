import sharp from 'sharp'

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
  private static readonly MAX_PIXELS = 60_000_000

  async strip(mimetype: string, bytes: Uint8Array): Promise<Uint8Array | null> {
    try {
      const image = sharp(bytes, {
        limitInputPixels: PhotoSanitizerService.MAX_PIXELS,
        failOn: 'error',
      }).rotate()

      return new Uint8Array(await PhotoSanitizerService.encode(image, mimetype).toBuffer())
    } catch {
      // The decoder refusing the bytes is the answer, not a failure of ours: the caller
      // turns `null` into a 422 for the resident.
      return null
    }
  }

  private static encode(image: sharp.Sharp, mimetype: string): sharp.Sharp {
    const encoders: Record<string, (pipeline: sharp.Sharp) => sharp.Sharp> = {
      'image/jpeg': (pipeline) => pipeline.jpeg({ quality: 90 }),
      'image/png': (pipeline) => pipeline.png(),
      'image/webp': (pipeline) => pipeline.webp({ quality: 90 }),
    }
    const encoder = encoders[mimetype]
    if (!encoder) throw new Error(`no encoder for ${mimetype}`)

    return encoder(image)
  }
}
