import { Link } from '@tanstack/react-router'
import type * as React from 'react'

import { BrandMark } from '#/components/common/brand-mark'
import { MaiyuCredit } from '#/components/common/maiyu-credit'
import { m } from '#/paraglide/messages'

/**
 * The footer: what the service is, the legal pages and the emergency number.
 * `stage-band` is the one deep green band of the public site; here it closes the page.
 */
export function Footer(): React.JSX.Element {
  return (
    <footer className="stage-band">
      <div className="page-container grid gap-8 py-10 md:grid-cols-2 lg:py-14">
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
          <ul className="flex flex-col gap-1 md:flex-row md:flex-wrap md:justify-end md:gap-x-6">
            {[
              { to: '/notices', label: m.nav_notices() },
              { to: '/about', label: m.nav_about() },
              { to: '/privacy', label: m.nav_privacy() },
              { to: '/terms', label: m.nav_terms() },
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
      <div className="page-container flex flex-col gap-1 pb-6 text-sm text-stage-muted md:flex-row md:items-center md:justify-between">
        <p>{m.footer_sample_notice()}</p>
        <MaiyuCredit className="text-stage-muted" />
      </div>
    </footer>
  )
}
