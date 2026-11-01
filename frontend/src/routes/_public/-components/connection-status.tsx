import { CloudSlashIcon, PaperPlaneTiltIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { useConnection } from '#/hooks/use-connection'
import { m } from '#/paraglide/messages'

/**
 * The strip that tells the truth about the connection. Offline: the app keeps working
 * (schedule and pages are cached) and a report is saved on the device. Online with
 * reports waiting: they are about to leave. `role="status"` so the change is announced
 * without stealing focus.
 */
export function ConnectionStatus(): React.JSX.Element | null {
  const { online, queued } = useConnection()

  if (online && queued === 0) return null

  return (
    <div
      role="status"
      data-slot="connection-status"
      className="border-b bg-badge-warning text-badge-warning-foreground"
    >
      <p className="mx-auto flex max-w-6xl items-start gap-3 px-4 py-3 text-base font-semibold">
        {!online && <CloudSlashIcon aria-hidden="true" weight="bold" className="mt-0.5 size-5 shrink-0" />}
        {online && <PaperPlaneTiltIcon aria-hidden="true" weight="bold" className="mt-0.5 size-5 shrink-0" />}
        <span>
          {!online && m.connection_offline()}
          {online && m.connection_sending({ count: queued })}
        </span>
      </p>
    </div>
  )
}
