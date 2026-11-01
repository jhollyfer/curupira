import { SmileyXEyesIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

/** The protocol does not exist: say what to check, and offer the way back to the form. */
export function TrackNotFound(): React.JSX.Element {
  return (
    <div className="page-container-md flex flex-col items-start gap-4 py-10 md:py-16">
      <SmileyXEyesIcon
        aria-hidden="true"
        weight="fill"
        className="size-14 text-muted-foreground"
      />
      <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-balance">
        {m.track_not_found_title()}
      </h1>
      <p className="text-lg text-muted-foreground">
        {m.track_not_found_text()}
      </p>
      <Button size="touch-lg" render={<Link to="/acompanhar" search={{}} />}>
        {m.track_try_again()}
      </Button>
    </div>
  )
}
