import { describe, expect, it } from 'vitest'

import { breadcrumbTitle, buildBreadcrumbs } from './breadcrumbs'

describe('buildBreadcrumbs', () => {
  it('turns the matched path into a trail, linking only real ancestors', () => {
    const crumbs = buildBreadcrumbs([
      { fullPath: '/gestao/', pathname: '/gestao/' },
      { fullPath: '/gestao/notices/', pathname: '/gestao/notices/' },
      { fullPath: '/gestao/notices/new', pathname: '/gestao/notices/new' },
    ])

    expect(crumbs.map((crumb) => crumb.to)).toEqual([
      '/gestao',
      '/gestao/notices',
      undefined,
    ])
  })

  it('does not link a segment that has no screen of its own', () => {
    const crumbs = buildBreadcrumbs([
      { fullPath: '/gestao/', pathname: '/gestao/' },
      {
        fullPath: '/gestao/account/profile/',
        pathname: '/gestao/account/profile/',
      },
    ])

    expect(crumbs.map((crumb) => crumb.to)).toEqual(['/gestao', undefined, undefined])
  })

  it('names a dynamic segment as the record, not as its id', () => {
    const crumbs = buildBreadcrumbs([
      { fullPath: '/gestao/reports/$id/', pathname: '/gestao/reports/abc/' },
    ])

    expect(crumbs.at(-1)?.label).not.toBe('abc')
  })

  it('is empty without matches', () => {
    expect(buildBreadcrumbs([])).toEqual([])
  })
})

describe('breadcrumbTitle', () => {
  it('lists the most specific first and drops the panel root', () => {
    const title = breadcrumbTitle([
      { label: 'Painel' },
      { label: 'Avisos' },
      { label: 'Novo' },
    ])

    expect(title).toBe('Novo · Avisos')
  })

  it('keeps the root when it is all there is', () => {
    expect(breadcrumbTitle([{ label: 'Painel' }])).toBe('Painel')
  })
})
