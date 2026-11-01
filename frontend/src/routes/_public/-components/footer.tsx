import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark'
import { m } from '#/paraglide/messages'

/**
 * The footer: what the service is, the legal pages and the emergency number.
 * `stage-band` is the one deep green band of the public site; here it closes the page.
 */
export function Footer(): React.JSX.Element {
  return (
    <footer className="stage-band pb-28 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <BrandMark className="text-stage-foreground" />
          <p className="max-w-prose text-base text-stage-muted">
            {m.footer_about()}
          </p>
          <p className="max-w-prose text-base font-semibold text-stage-foreground">
            {m.footer_emergency()}
          </p>
        </div>
        <nav aria-label={m.footer_nav_label()}>
          <ul className="flex flex-col gap-1 md:items-end">
            {[
              { to: '/avisos', label: m.nav_notices() },
              { to: '/sobre', label: m.nav_about() },
              { to: '/privacidade', label: m.nav_privacy() },
              { to: '/termos', label: m.nav_terms() },
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-flex min-h-11 items-center rounded-lg px-1 text-base font-medium text-stage-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-stage-foreground/60"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-6 text-sm text-stage-muted">
        {m.footer_sample_notice()}
      </p>
    </footer>
  )
}
