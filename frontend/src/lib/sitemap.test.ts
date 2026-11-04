import { describe, expect, it } from 'vitest'

import { env } from '#/env'

import { SITEMAP_STATIC_ENTRIES, robotsTxt, sitemapXml } from './sitemap'

describe('sitemapXml', () => {
  const xml = sitemapXml([
    { pathname: '/schedule' },
    { pathname: '/map', lastModified: '2026-10-01T10:00:00Z' },
  ])

  it('brings one url per language for each page', () => {
    expect(xml.match(/<url>/g)).toHaveLength(6)
  })

  it('writes pt-BR without a prefix and the others with a prefix', () => {
    expect(xml).toContain(`<loc>${env.VITE_SITE_URL}/schedule</loc>`)
    expect(xml).toContain(`<loc>${env.VITE_SITE_URL}/es/schedule</loc>`)
    expect(xml).toContain(`<loc>${env.VITE_SITE_URL}/en/schedule</loc>`)
  })

  it('links each url to the sibling hreflangs and to x-default', () => {
    expect(xml).toContain(
      `hreflang="es" href="${env.VITE_SITE_URL}/es/schedule"`,
    )
    expect(xml).toContain(
      `hreflang="x-default" href="${env.VITE_SITE_URL}/schedule"`,
    )
  })

  it('writes lastmod only when the data has a date', () => {
    expect(xml.match(/<lastmod>/g)).toHaveLength(3)
  })
})

describe('SITEMAP_STATIC_ENTRIES', () => {
  it('covers the home and every public page, and never the panel', () => {
    const paths = SITEMAP_STATIC_ENTRIES.map((entry) => entry.pathname)

    expect(paths).toEqual([
      '/',
      '/schedule',
      '/report',
      '/track',
      '/map',
      '/notices',
      '/about',
      '/privacy',
      '/terms',
    ])
    expect(paths.some((path) => path.startsWith('/management'))).toBe(false)
  })
})

describe('robotsTxt', () => {
  it('in production, keeps the panel and sign-in out and points at the absolute sitemap', () => {
    const text = robotsTxt({ indexable: true })

    expect(text).toContain('Disallow: /management')
    expect(text).toContain(`Sitemap: ${env.VITE_SITE_URL}/sitemap.xml`)
  })

  it('outside production, forbids everything', () => {
    expect(robotsTxt({ indexable: false })).toBe('User-agent: *\nDisallow: /\n')
  })
})
