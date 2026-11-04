import { describe, expect, it } from 'vitest'

import { env } from '#/env'
import { m } from '#/paraglide/messages'

import {
  breadcrumbJsonLd,
  jsonLd,
  localizedUrl,
  noindexMeta,
  organizationJsonLd,
  pageHead,
} from './page-head'

describe('localizedUrl', () => {
  it('leaves pt-BR without prefix and gives es/en the language prefix', () => {
    expect(localizedUrl('/schedule', 'pt-BR')).toBe(
      `${env.VITE_SITE_URL}/schedule`,
    )
    expect(localizedUrl('/schedule', 'es')).toBe(
      `${env.VITE_SITE_URL}/es/schedule`,
    )
    expect(localizedUrl('/schedule', 'en')).toBe(
      `${env.VITE_SITE_URL}/en/schedule`,
    )
  })

  it('strips the trailing slash, except at the root', () => {
    expect(localizedUrl('/', 'es')).toBe(`${env.VITE_SITE_URL}/es`)
  })
})

describe('pageHead', () => {
  const head = pageHead({ title: 'Coleta', pathname: '/schedule' })

  it('puts the site suffix on the title', () => {
    expect(head.meta).toContainEqual({
      title: `Coleta | ${m.common_site_title()}`,
    })
  })

  it('without a title, uses only the site name', () => {
    const bare = pageHead({ pathname: '/' })

    expect(bare.meta).toContainEqual({ title: m.common_site_title() })
  })

  it('declares the canonical and the reciprocal hreflang of the three versions', () => {
    expect(head.links).toContainEqual({
      rel: 'canonical',
      href: `${env.VITE_SITE_URL}/schedule`,
    })

    for (const hrefLang of ['pt-BR', 'es', 'en', 'x-default']) {
      expect(head.links.some((link) => link.hrefLang === hrefLang)).toBe(true)
    }
  })

  it('makes x-default point at the pt-BR version', () => {
    const fallback = head.links.find((link) => link.hrefLang === 'x-default')

    expect(fallback?.href).toBe(`${env.VITE_SITE_URL}/schedule`)
  })

  it('carries the Open Graph', () => {
    const properties = head.meta.flatMap((item) => {
      if ('property' in item) return [item.property]

      return []
    })

    expect(properties).toEqual(
      expect.arrayContaining([
        'og:title',
        'og:description',
        'og:image',
        'og:url',
        'og:locale',
      ]),
    )
  })

  it('turns structuredData into an application/ld+json script', () => {
    const withData = pageHead({ pathname: '/x', structuredData: ['{"a":1}'] })

    expect(withData.scripts).toEqual([
      { type: 'application/ld+json', children: '{"a":1}' },
    ])
    expect(head.scripts).toEqual([])
  })

  it('adds robots for noindex, and a normal page does not carry it', () => {
    const hidden = pageHead({ pathname: '/x', noindex: true })

    expect(hidden.meta).toContainEqual({
      name: 'robots',
      content: 'noindex, nofollow',
    })
    expect(JSON.stringify(head.meta)).not.toContain('robots')
  })
})

describe('noindexMeta', () => {
  it('generates robots only when the environment is not indexable', () => {
    expect(noindexMeta(false)).toEqual([
      { name: 'robots', content: 'noindex, nofollow' },
    ])
    expect(noindexMeta(true)).toEqual([])
    expect(noindexMeta(undefined)).toEqual([])
  })
})

describe('jsonLd', () => {
  it('escapes the < so the script tag is not closed from the inside', () => {
    const text = jsonLd({ name: '</script><b>' })

    expect(text).not.toContain('<')
    expect(text).toContain('\\u003c')
  })

  it('organizationJsonLd descreve a Organization do site', () => {
    const data: unknown = JSON.parse(organizationJsonLd())

    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      url: env.VITE_SITE_URL,
    })
  })
})

describe('breadcrumbJsonLd', () => {
  it('numbers the steps and uses each one absolute URL', () => {
    const data: unknown = JSON.parse(
      breadcrumbJsonLd([
        { name: 'Início', pathname: '/' },
        { name: 'Classificação', pathname: '/standings' },
      ]),
    )

    expect(data).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: 'Início', item: `${env.VITE_SITE_URL}/` },
        {
          position: 2,
          name: 'Classificação',
          item: `${env.VITE_SITE_URL}/standings`,
        },
      ],
    })
  })
})
