import {
  CheckCircleIcon,
  CloudArrowUpIcon,
  CopyIcon,
} from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import type { ReportOutcome } from '#/hooks/use-report-submit'
import { m } from '#/paraglide/messages'

type ReportDoneProps = Readonly<{
  outcome: ReportOutcome
  onNewReport: () => void
}>

/**
 * The end of the flow. Two truths, never mixed: "sent" shows the protocol (the only key
 * to follow the report, so it is large, copyable and mentioned as the thing to keep),
 * and "saved on the device" says plainly that it has NOT left yet and will go by itself
 * when the connection returns.
 */
export function ReportDone({
  outcome,
  onNewReport,
}: ReportDoneProps): React.JSX.Element {
  const [copied, setCopied] = React.useState(false)
  const heading = React.useRef<HTMLHeadingElement>(null)

  // The form is gone; focus the new heading so the result is announced and the
  // keyboard starts from it.
  React.useEffect(() => {
    heading.current?.focus()
  }, [])

  async function copy(protocol: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(protocol)
      setCopied(true)
    } catch {
      // Clipboard blocked: the code is on screen and selectable.
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      {outcome.state === 'sent' && (
        <>
          <div className="flex flex-col gap-3">
            <CheckCircleIcon
              aria-hidden="true"
              weight="fill"
              className="size-14 text-primary"
            />
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-4xl leading-tight font-extrabold tracking-tight text-balance outline-none"
            >
              {m.report_done_title()}
            </h1>
            <p className="text-lg text-muted-foreground">
              {m.report_done_text()}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl bg-card p-5 shadow-card-elevated sm:p-6">
            <p className="text-base font-semibold text-muted-foreground">
              {m.report_done_protocol()}
            </p>
            <p
              data-testid="protocol"
              // Fluid on purpose: at 360px a fixed `text-4xl` broke "CUR-XXXX-XXXX" after the second
              // dash, and a protocol split in two lines is a protocol copied wrong by hand.
              className="text-[clamp(1.625rem,7.4vw,2.25rem)] font-extrabold tracking-wider whitespace-nowrap tabular-nums select-all"
            >
              {outcome.protocol}
            </p>
            <Button
              type="button"
              variant="outline"
              size="touch"
              className="self-start"
              onClick={() => {
                void copy(outcome.protocol)
              }}
            >
              <CopyIcon aria-hidden="true" />
              {m.report_done_copy()}
            </Button>
            <p
              role="status"
              className="min-h-6 text-base font-semibold text-primary"
            >
              {copied && m.report_done_copied()}
            </p>
          </div>

          <p className="text-base text-muted-foreground">
            {m.report_done_keep()}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="touch-lg"
              render={
                <Link
                  to="/acompanhar"
                  search={{ protocol: outcome.protocol }}
                />
              }
            >
              {m.report_done_track()}
            </Button>
            <Button size="touch-lg" variant="outline" onClick={onNewReport}>
              {m.report_done_another()}
            </Button>
          </div>
        </>
      )}

      {outcome.state === 'queued' && (
        <>
          <div className="flex flex-col gap-3">
            <CloudArrowUpIcon
              aria-hidden="true"
              weight="fill"
              className="size-14 text-primary"
            />
            <h1
              ref={heading}
              tabIndex={-1}
              className="text-4xl leading-tight font-extrabold tracking-tight text-balance outline-none"
            >
              {m.report_queued_title()}
            </h1>
          </div>
          <p
            role="status"
            className="rounded-2xl bg-badge-warning p-4 text-lg font-semibold text-badge-warning-foreground"
          >
            {m.report_queued_text()}
          </p>
          <p className="text-base text-muted-foreground">
            {m.report_queued_next()}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="touch-lg" onClick={onNewReport}>
              {m.report_done_another()}
            </Button>
            <Button size="touch-lg" variant="outline" render={<Link to="/" />}>
              {m.report_done_home()}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
