/**
 * A phone photo as the specs need it: a real, decodable JPEG that carries an EXIF block
 * with a GPS position (4 deg 22 min 59 s S, 70 deg 1 min 50 s W: inside Benjamin
 * Constant), the way a camera writes it.
 *
 * It is hand-built on purpose. The point of the privacy specs is to prove the position
 * never reaches the stored file, and a fixture that already had no EXIF would prove
 * nothing. The base is a 48x32 solid JPEG, and the APP1 segment is spliced in right
 * after the SOI marker.
 */
const BASE_JPEG = Buffer.from(
  '/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAgADADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAQF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AngJWMAAAAAAAAAA//9k=',
  'base64',
)

const EXIF_HEADER = Buffer.from('Exif\0\0', 'latin1')

function u16(value: number): Buffer {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16BE(value)

  return buffer
}

function u32(value: number): Buffer {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(value)

  return buffer
}

/** One IFD entry: tag, type, count and the 4-byte value (or the offset to it). */
function entry(tag: number, type: number, count: number, value: Buffer) {
  return Buffer.concat([u16(tag), u16(type), u32(count), value])
}

function rationals(values: ReadonlyArray<readonly [number, number]>): Buffer {
  return Buffer.concat(values.flatMap(([n, d]) => [u32(n), u32(d)]))
}

/** Big-endian TIFF: IFD0 points at a GPS IFD with latitude and longitude. */
function gpsTiff(): Buffer {
  const header = Buffer.concat([Buffer.from('MM'), u16(42), u32(8)])
  const gpsIfdOffset = 26
  const latitudeOffset = 80
  const longitudeOffset = 104

  const ifd0 = Buffer.concat([
    u16(1),
    entry(0x8825, 4, 1, u32(gpsIfdOffset)),
    u32(0),
  ])
  const gpsIfd = Buffer.concat([
    u16(4),
    entry(1, 2, 2, Buffer.from('S\0\0\0', 'latin1')),
    entry(2, 5, 3, u32(latitudeOffset)),
    entry(3, 2, 2, Buffer.from('W\0\0\0', 'latin1')),
    entry(4, 5, 3, u32(longitudeOffset)),
    u32(0),
  ])
  const latitude = rationals([
    [4, 1],
    [22, 1],
    [5900, 100],
  ])
  const longitude = rationals([
    [70, 1],
    [1, 1],
    [5000, 100],
  ])

  return Buffer.concat([header, ifd0, gpsIfd, latitude, longitude])
}

/** The JPEG with the EXIF/GPS block. */
export function photoWithGps(): Buffer {
  const payload = Buffer.concat([EXIF_HEADER, gpsTiff()])
  const app1 = Buffer.concat([
    Buffer.from([0xff, 0xe1]),
    u16(payload.length + 2),
    payload,
  ])

  return Buffer.concat([BASE_JPEG.subarray(0, 2), app1, BASE_JPEG.subarray(2)])
}

/**
 * Whether the file still carries camera metadata: the EXIF header, the XMP packet or an
 * APP1 marker. Looking for the bytes keeps the spec free of an image library.
 */
export function hasEmbeddedMetadata(file: Buffer): boolean {
  if (file.includes(EXIF_HEADER)) return true
  if (file.includes(Buffer.from('http://ns.adobe.com/xap/1.0/'))) return true

  return file.includes(Buffer.from([0xff, 0xe1]))
}
