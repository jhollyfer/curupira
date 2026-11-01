import { MapPinIcon } from '@phosphor-icons/react'
import { Link, getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { subscribeLocal } from '#/lib/local-store'
import { readProtocolsSnapshot } from '#/lib/report-history'
import { m } from '#/paraglide/messages'

import { TrackForm } from './track-form'
import { TrackResult } from './track-result'

const route = getRouteApi('/_public/acompanhar/')

export function TrackPage(): React.JSX.Element {
  const { protocol } = route.useSearch()
  // `localStorage` does not exist on the server: the snapshot there is empty.
  const remembered = React.useSyncExternalStore(
    subscribeLocal,
    readProtocolsSnapshot,
    () => '',
  )
  const mine = remembered.split('|').filter(Boolean)

  return (
    <div className="page-container-md grid grid-cols-[minmax(0,1fr)] gap-8 py-8 md:py-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-14">
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-fluid-title font-extrabold tracking-tight text-balance">
            {m.track_title()}
          </h1>
          <p className="text-lg text-muted-foreground">{m.track_intro()}</p>
        </header>

        {/* `key` restarts the form when the code in the URL changes (a link from the
            report's end, or one of the chips below). */}
        <TrackForm key={protocol ?? ''} defaultProtocol={protocol ?? ''} />

        {mine.length > 0 && (
          <section aria-labelledby="track-mine" className="flex flex-col gap-2">
            <h2
              id="track-mine"
              className="text-base font-semibold text-muted-foreground"
            >
              {m.track_mine()}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {mine.map((item) => (
                <li key={item}>
                  <Link
                    to="/acompanhar"
                    search={{ protocol: item }}
                    className="inline-flex min-h-11 items-center rounded-xl bg-accent px-4 text-base font-bold tracking-wide tabular-nums text-accent-foreground outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* The result takes the right column from `lg`. Without a code the column is not
          left empty: it says what the code is for (the same sentence as the home's third
          step), and it is hidden on a phone, where the form already fills the screen. */}
      {protocol && (
        <React.Suspense
          fallback={
            <Skeleton
              role="status"
              aria-label={m.common_loading()}
              className="h-80 w-full rounded-3xl"
            />
          }
        >
          <TrackResult protocol={protocol} />
        </React.Suspense>
      )}
      {!protocol && (
        <aside className="hidden gap-4 rounded-3xl bg-surface-warm p-8 lg:flex">
          <MapPinIcon
            aria-hidden="true"
            weight="fill"
            className="mt-1 size-8 shrink-0 text-primary"
          />
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">{m.home_how_3_title()}</h2>
            <p className="text-lg text-muted-foreground">
              {m.home_how_3_text()}
            </p>
          </div>
        </aside>
      )}
    </div>
  )
}
