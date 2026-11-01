/**
 * Shrinks a phone photo before it is stored or sent.
 *
 * Two reasons, both about this audience. First the weight: a 12 MP camera photo is
 * 4 to 8 MB, and on a weak mobile signal that is the difference between a report that
 * leaves and one that waits forever. Second the privacy: redrawing on a canvas drops
 * the EXIF block, where phones write the exact GPS position of the camera, so an
 * "anonymous" report no longer carries a trace of who took it or from where.
 *
 * Any failure (unsupported format, no canvas) returns the original file: a heavy photo
 * is better than no photo.
 */

const MAX_SIDE = 1600
const QUALITY = 0.8

export async function downscaleImage(file: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    })

    if (!blob || blob.size >= file.size) return file

    return blob
  } catch {
    return file
  }
}
