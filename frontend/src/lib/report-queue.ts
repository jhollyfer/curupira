import type { Merge, StorefrontReportCreatePayload } from '@curupira/shared'

import { HTTPError } from '#/integrations/tanstack-query/http'

/**
 * The outbox of reports that could not leave: photo and payload kept in IndexedDB
 * until the connection comes back.
 *
 * Why IndexedDB and not `localStorage`: the photos are binary (a `Blob` stores as is,
 * with structured clone) and `localStorage` holds strings only, capped at about 5 MB
 * and synchronous. A base64 photo would blow the quota and freeze the page.
 *
 * Why the queue lives here and not in the service worker: Background Sync is not in
 * Safari/iOS, and a resident on an iPhone is exactly who sends from a spot with no
 * signal. The page flushes on the `online` event and on open instead; it works
 * everywhere and the queue stays a plain, testable function.
 *
 * Official reference: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */

export type ReportDraft = Merge<
  Omit<StorefrontReportCreatePayload, 'photoIds'>,
  { photos: ReadonlyArray<Blob> }
>

export type QueuedReport = Readonly<{
  id: string
  createdAt: string
  draft: ReportDraft
}>

const DB_NAME = 'curupira'
const STORE = 'report-queue'
const VERSION = 1

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** One request on the store, with the connection closed afterwards. */
async function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await open()

  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(
        database.transaction(STORE, mode).objectStore(STORE),
      )

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    database.close()
  }
}

/** Fired on every change of the queue, so a banner can recount without polling. */
export const QUEUE_EVENT = 'curupira:report-queue'

function notifyQueueChanged(): void {
  try {
    globalThis.dispatchEvent(new Event(QUEUE_EVENT))
  } catch {
    // No window: SSR and the node test environment have nobody to tell.
  }
}

let sequence = 0

/**
 * The key sorts as the queue must send: by time, then by arrival within the same
 * millisecond (two taps in a row), then a UUID so two tabs never collide. IndexedDB
 * returns records in key order, so the order is a property of the store, not a sort.
 */
function nextId(now: Date): string {
  sequence += 1

  return [
    String(now.getTime()).padStart(15, '0'),
    String(sequence).padStart(6, '0'),
    crypto.randomUUID(),
  ].join('-')
}

export async function enqueueReport(draft: ReportDraft): Promise<QueuedReport> {
  const now = new Date()
  const item: QueuedReport = {
    id: nextId(now),
    createdAt: now.toISOString(),
    draft,
  }

  await run('readwrite', (store) => store.add(item))
  notifyQueueChanged()

  return item
}

export async function listQueuedReports(): Promise<Array<QueuedReport>> {
  // Key order is send order (see `nextId`).
  return await run('readonly', (store) => store.getAll())
}

export async function countQueuedReports(): Promise<number> {
  return await run('readonly', (store) => store.count())
}

export async function removeQueuedReport(id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(id))
  notifyQueueChanged()
}

export type FlushResult = Readonly<{
  /** Protocols of the reports that left. */
  sent: ReadonlyArray<string>
  /** Reports the server refused for good (4xx): dropped, retrying would loop. */
  dropped: number
  remaining: number
}>

/** A network failure or a 5xx may work next time; a 4xx will not. */
function isRetryable(error: unknown): boolean {
  if (error instanceof HTTPError) return error.isServerError

  return true
}

let flushing: Promise<FlushResult> | null = null

/**
 * Sends the queue, oldest first, stopping at the first failure that can be retried so
 * the order is kept. A second call while one runs gets the same promise: `online`
 * fires more than once in a row on some phones, and two flushes would send twice.
 */
export function flushQueue(
  send: (draft: ReportDraft) => Promise<{ protocol: string }>,
): Promise<FlushResult> {
  flushing ??= (async () => {
    const sent: Array<string> = []
    let dropped = 0

    try {
      for (const item of await listQueuedReports()) {
        try {
          const { protocol } = await send(item.draft)
          sent.push(protocol)
        } catch (error) {
          if (isRetryable(error)) break
          dropped += 1
        }

        await removeQueuedReport(item.id)
      }
    } finally {
      flushing = null
    }

    return { sent, dropped, remaining: await countQueuedReports() }
  })()

  return flushing
}
