import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '#/components/ui/empty'
import { m } from '#/paraglide/messages'

/**
 * The 404 inside the panel: a record that does not exist (a deleted occurrence, a
 * mistyped id) or an address with no screen. It is drawn *inside* the shell, so the
 * sidebar stays and the way back is one click, instead of the public site's full-page
 * 404 that would throw the manager out of the panel.
 */
export function PanelNotFound(): React.JSX.Element {
  return (
    <Empty className="m-auto max-w-md">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MagnifyingGlassIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{m.panel_not_found_title()}</EmptyTitle>
        <EmptyDescription>{m.panel_not_found_description()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" render={<Link to="/gestao" />}>
          {m.panel_not_found_action()}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
