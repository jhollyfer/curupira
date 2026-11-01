import * as React from 'react'

import { QUEUE_EVENT, countQueuedReports } from '#/lib/report-queue'

export type Connection = Readonly<{
  online: boolean
  /** Reports waiting on this device for a connection. */
  queued: number
}>

/**
 * Whether the browser has a connection and how many reports are waiting to go out.
 *
 * Starts as "online, nothing queued" on purpose: the server cannot know either, and any
 * other first value would make the hydrated HTML differ from the server's. The real
 * values arrive in the effect, right after mount.
 *
 * `navigator.onLine` is a hint, not a promise (it says there is a network interface,
 * not that the internet answers), which is why the send still treats a failed request as
 * "offline" and queues it (`use-report-submit.ts`).
 */
export function useConnection(): Connection {
  const [online, setOnline] = React.useState(true)
  const [queued, setQueued] = React.useState(0)

  React.useEffect(() => {
    let alive = true

    async function recount(): Promise<void> {
      try {
        const count = await countQueuedReports()
        if (alive) setQueued(count)
      } catch {
        // IndexedDB unavailable (private mode): there is no queue to count.
      }
    }

    const update = (): void => setOnline(navigator.onLine)
    update()
    void recount()

    globalThis.addEventListener('online', update)
    globalThis.addEventListener('offline', update)
    globalThis.addEventListener(QUEUE_EVENT, recount)

    return () => {
      alive = false
      globalThis.removeEventListener('online', update)
      globalThis.removeEventListener('offline', update)
      globalThis.removeEventListener(QUEUE_EVENT, recount)
    }
  }, [])

  return { online, queued }
}
