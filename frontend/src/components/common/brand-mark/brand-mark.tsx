import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import type * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

type BrandMarkProps = Readonly<{
  className?: string
  /** Hide the word and keep the mark (tight spaces). */
  compact?: boolean
  /** Where the mark leads. The panel points it at its own front door. */
  to?: LinkProps['to']
}>

/**
 * The Curupira mark: a leaf on a green tile. One simple geometric shape, not an
 * illustration - the app has no photography, and a drawn mascot would be a placeholder
 * pretending to be identity. The same drawing is `public/favicon.svg`; change both
 * together (`scripts/generate-icons.mjs` rebuilds the PNGs).
 */
export function BrandMark({
  className,
  compact = false,
  to = '/',
}: BrandMarkProps): React.JSX.Element {
  return (
    <Link
      to={to}
      aria-label={m.common_home_link()}
      className={cn(
        'inline-flex min-h-11 items-center gap-2.5 rounded-xl text-xl font-extrabold tracking-tight outline-none focus-visible:ring-4 focus-visible:ring-ring/60',
        className,
      )}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-9 shrink-0">
        <rect width="32" height="32" rx="9" fill="var(--field)" />
        <path
          d="M8 24c0-9 5-15 16-16 0 10-6 16-16 16z"
          fill="oklch(0.98 0.02 150)"
        />
        <path
          d="M8 24l8-8"
          stroke="var(--field)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {!compact && <span>{m.common_brand_name()}</span>}
    </Link>
  )
}
