import type { ReportKind } from '@curupira/shared'
import { useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import { toast } from 'sonner'

import { DEPENDENTS } from '#/hooks/tanstack-query/_query-keys'
import { useStorefrontReportCreateMutation } from '#/integrations/tanstack-query/mutations/storefront'
import { rememberProtocol } from '#/lib/report-history'
import { enqueueReport } from '#/lib/report-queue'
import type { ReportDraft } from '#/lib/report-queue'
import { m } from '#/paraglide/messages'

/** What happened to the report the resident just sent. */
export type ReportOutcome =
  | Readonly<{ state: 'sent'; protocol: string; kind: ReportKind }>
  | Readonly<{ state: 'queued'; kind: ReportKind }>

/**
 * Sends a report, or keeps it on the device when there is no way to send now.
 *
 * Two roads to the queue: the browser says it is offline (no point trying, and no
 * 15-second wait for a timeout), or the attempt fails with a network/5xx error (the
 * "online" flag lies on a weak mobile signal). A 4xx is not queued: the server refused
 * the content, and waiting would not change that - the message goes to the resident.
 */
export function useReportSubmit() {
  const queryClient = useQueryClient()
  const [outcome, setOutcome] = React.useState<ReportOutcome | null>(null)

  async function keep(draft: ReportDraft): Promise<void> {
    try {
      await enqueueReport(draft)
      setOutcome({ state: 'queued', kind: draft.kind })
    } catch {
      // IndexedDB refused (private mode, no space): saying "saved" would be a lie.
      toast.error(m.report_error_queue())
    }
  }

  const mutation = useStorefrontReportCreateMutation({
    onSuccess: async ({ protocol }, draft) => {
      rememberProtocol(protocol)
      setOutcome({ state: 'sent', protocol, kind: draft.kind })
      await Promise.all(
        DEPENDENTS.reports.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      )
    },
    onError: async (error, draft) => {
      if (error.isServerError) {
        await keep(draft)
        return
      }

      toast.error(error.message)
    },
  })

  async function submit(draft: ReportDraft): Promise<void> {
    if (!navigator.onLine) {
      await keep(draft)
      return
    }

    mutation.mutate(draft)
  }

  return {
    submit,
    outcome,
    isPending: mutation.isPending,
    reset: () => setOutcome(null),
  }
}
