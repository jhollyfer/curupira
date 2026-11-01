import { Link, getRouteApi } from '@tanstack/react-router'
import * as React from 'react'

import { Skeleton } from '#/components/ui/skeleton'
import { readProtocols } from '#/lib/report-history'
import { m } from '#/paraglide/messages'

import { TrackForm } from './track-form'
import { TrackResult } from './track-result'

const route = getRouteApi('/_public/acompanhar/')

export function TrackPage(): React.JSX.Element {
  const { protocol } = route.useSearch()
  // Read after mount: `localStorage` does not exist on the server.
  const [mine, setMine] = React.useState<Array<string>>([])

  React.useEffect(() => {
    setMine(readProtocols())
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
          {m.track_title()}
        </h1>
        <p className="text-lg text-muted-foreground">{m.track_intro()}</p>
      </header>

      {/* `key` restarts the form when the code in the URL changes (a link from the
          report's end, or one of the chips below). */}
      <TrackForm key={protocol ?? ''} defaultProtocol={protocol ?? ''} />

      {mine.length > 0 && (
        <section aria-labelledby="track-mine" className="flex flex-col gap-2">
          <h2 id="track-mine" className="text-base font-semibold text-muted-foreground">
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

      {protocol && (
        <React.Suspense
          fallback={<Skeleton role="status" aria-label={m.common_loading()} className="h-80 w-full rounded-3xl" />}
        >
          <TrackResult protocol={protocol} />
        </React.Suspense>
      )}
    </div>
  )
}
