import type * as React from 'react'

/**
 * A click on the row opens the record - unless it was meant for something inside it. The
 * link, the actions menu and the dialogs it opens all live under the row in the React
 * tree (a portal's events bubble through it), so `contains` filters the portal's and
 * `closest` the interactive controls' own clicks.
 */
export function isRowClick(event: React.MouseEvent<HTMLElement>): boolean {
  const target = event.target
  if (!(target instanceof Element)) return false
  if (!event.currentTarget.contains(target)) return false

  return !target.closest(
    'a, button, input, select, textarea, [role="menuitem"]',
  )
}
