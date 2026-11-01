import { m } from '#/paraglide/messages'

/**
 * The panel's trail, built from the matched routes' own paths - no per-screen
 * configuration. A segment's label comes from the table below; a `$param` segment is a
 * record ("Detalhe"), and anything unknown falls back to the raw segment so a new route
 * shows something until its label is added.
 */
export type Crumb = {
  label: string
  to?: string
}

const SEGMENT_LABELS: Record<string, string | undefined> = {
  get gestao() {
    return m.panel_crumb_panel()
  },
  get reports() {
    return m.panel_crumb_reports()
  },
  get notices() {
    return m.panel_crumb_notices()
  },
  get schedules() {
    return m.panel_crumb_schedules()
  },
  get neighborhoods() {
    return m.panel_crumb_neighborhoods()
  },
  get users() {
    return m.panel_crumb_users()
  },
  get account() {
    return m.panel_crumb_account()
  },
  get profile() {
    return m.panel_crumb_profile()
  },
  get new() {
    return m.panel_crumb_new()
  },
  get edit() {
    return m.panel_crumb_edit()
  },
}

function segments(path: string): Array<string> {
  return path.split('/').filter(Boolean)
}

export type BreadcrumbMatch = {
  fullPath: string
  pathname: string
}

/**
 * Only an ancestor that is itself a route is a link: `/gestao/account` has no screen of
 * its own, and linking it would land on a 404.
 */
export function buildBreadcrumbs(
  matches: ReadonlyArray<BreadcrumbMatch>,
): Array<Crumb> {
  const last = matches.at(-1)

  if (!last) return []

  const navigable = new Set(
    matches.map((match) => match.pathname.replace(/\/$/, '')),
  )

  const pattern = segments(last.fullPath)
  const actual = segments(last.pathname)
  const crumbs: Array<Crumb> = []

  for (const [index, value] of actual.entries()) {
    const token = pattern[index] ?? value
    const to = '/'.concat(actual.slice(0, index + 1).join('/'))

    let label = SEGMENT_LABELS[token] ?? value
    if (token.startsWith('$')) label = m.panel_crumb_detail()

    const crumb: Crumb = { label }

    if (index < actual.length - 1 && navigable.has(to)) crumb.to = to

    crumbs.push(crumb)
  }

  return crumbs
}

/** The tab title: most specific first, without the panel's own name repeated. */
export function breadcrumbTitle(crumbs: ReadonlyArray<Crumb>): string {
  const labels = crumbs.map((crumb) => crumb.label)
  let start = 0
  if (labels.length > 1) start = 1

  return labels.slice(start).reverse().join(' · ')
}
