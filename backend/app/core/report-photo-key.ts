/**
 * Where the keys of the anonymous report photos live in the bucket. The key is drawn by the
 * server (`StorageContract.reportPhotoKey`), never by the client, so the prefix is a marker
 * the library flow cannot forge: it tells a photo born from `report-photos/create` apart
 * from a file of the management library, which an anonymous caller must not be able to
 * confirm, overwrite or attach to a report just by knowing its uuid.
 *
 * It lives in `core/` because both the bucket service and the domain entity read it, and
 * neither may import the other's layer.
 */
export const REPORT_PHOTO_KEY_PREFIX = 'report-photos/'
