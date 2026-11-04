import { ArrowSquareOutIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateTitle,
} from '#/components/common/empty-state'
import { buttonVariants } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

/** The city hall's official site: who keeps the schedule answers for a missing one. */
export const CITY_HALL_URL = 'https://benjaminconstant.am.gov.br'

/**
 * The neighborhood has no collection registered at all (docs/USER-FLOWS.md, "Bairro sem
 * cronograma"). Not the same as "no pickup in the coming days": here there is nothing to
 * wait for, so the resident is sent to the city hall instead of being told to come back.
 */
export function NoSchedule(): React.JSX.Element {
  return (
    <EmptyState reason="empty" data-testid="no-schedule">
      <EmptyStateTitle>{m.no_schedule_title()}</EmptyStateTitle>
      <EmptyStateDescription>{m.no_schedule_text()}</EmptyStateDescription>
      <EmptyStateActions>
        <a
          href={CITY_HALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'outline', size: 'touch' })}
        >
          {m.no_schedule_city_hall()}
          <ArrowSquareOutIcon aria-hidden="true" />
        </a>
      </EmptyStateActions>
    </EmptyState>
  )
}
