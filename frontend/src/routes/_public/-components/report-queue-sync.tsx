import { useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { toast } from 'sonner'

import { DEPENDENTS } from '#/hooks/tanstack-query/_query-keys'
import { sendReport } from '#/integrations/tanstack-query/mutations/storefront'
import { rememberProtocol } from '#/lib/report-history'
import { flushQueue } from '#/lib/report-queue'
import { m } from '#/paraglide/messages'

/**
 * Sends the reports kept on the device as soon as there is a way to: when the app
 * opens and every time the browser says the connection is back. Renders nothing.
 *
 * It lives in the public layout, which is mounted for the whole visit - a resident who
 * sent from a bus with no signal and then kept using the app gets the protocol as a
 * toast the moment the signal returns, wherever they are in the app.
 */
export function ReportQueueSync(): null {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    let alive = true

    async function flush(): Promise<void> {
      if (!navigator.onLine) return

      try {
        const result = await flushQueue(sendReport)
        if (!alive) return

        for (const protocol of result.sent) {
          rememberProtocol(protocol)
          toast.success(m.report_queue_sent({ protocol }), { duration: 15_000 })
        }
        if (result.dropped > 0) toast.error(m.report_queue_dropped())
        if (result.sent.length > 0) {
          await Promise.all(
            DEPENDENTS.reports.map((queryKey) =>
              queryClient.invalidateQueries({ queryKey }),
            ),
          )
        }
      } catch {
        // IndexedDB unavailable: there is no queue to send.
      }
    }

    void flush()
    globalThis.addEventListener('online', flush)

    return () => {
      alive = false
      globalThis.removeEventListener('online', flush)
    }
  }, [queryClient])

  return null
}
