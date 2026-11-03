import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import en from '../../messages/en.json'
import es from '../../messages/es.json'
import ptBR from '../../messages/pt-BR.json'

/**
 * What belongs to the house in the message files (`_standards/i18n.md` §4). Paraglide
 * does not complain about a key missing in one language - it falls back to the base
 * one, and the Spanish page gets a Portuguese sentence in the middle with no error -
 * nor about a key nothing uses, which is the one nobody reviews when the text changes.
 * (`inlang check` covers the variables and the plurals.)
 */
const FILES = { 'pt-BR': ptBR, es, en }

const root = join(import.meta.dirname, '..', '..')

/** A message's texts, including those of the plural variants. */
function texts(value: unknown): Array<string> {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(texts)
  if (typeof value === 'object' && value !== null)
    return Object.values(value).flatMap(texts)

  return []
}

function keysOf(file: Record<string, unknown>): Array<string> {
  return Object.keys(file)
    .filter((key) => key !== '$schema')
    .sort()
}

/** Every `.ts`/`.tsx` of `src/`, except tests and what Paraglide generates. */
function sources(dir: string): Array<string> {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (name === 'paraglide') return []
    if (statSync(path).isDirectory()) return sources(path)
    if (!/\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name)) return []

    return [readFileSync(path, 'utf8')]
  })
}

/** The `{variables}` a message interpolates. */
function variables(text: string): Array<string> {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort()
}

describe('messages', () => {
  it.each(Object.entries(FILES))(
    '%s has no em dash nor "..." in any value',
    (_locale, file) => {
      const offenders = Object.entries(file)
        .filter(([key]) => key !== '$schema')
        .filter(([, value]) =>
          texts(value).some((text) => /[—–]|\.\.\./.test(text)),
        )
        .map(([key]) => key)

      expect(offenders).toEqual([])
    },
  )

  it.each(Object.entries(FILES))('%s has no empty message', (_locale, file) => {
    const empty = Object.entries(file)
      .filter(([key]) => key !== '$schema')
      .filter(([, value]) => texts(value).some((text) => !text.trim()))
      .map(([key]) => key)

    expect(empty).toEqual([])
  })

  it.each([
    ['es', es],
    ['en', en],
  ])('%s has exactly the key set of pt-BR', (_locale, file) => {
    expect(keysOf(file)).toEqual(keysOf(ptBR))
  })

  it.each([
    ['es', es],
    ['en', en],
  ])('%s interpolates the same variables as pt-BR', (_locale, file) => {
    const divergent = Object.entries(ptBR)
      .filter(([key]) => key !== '$schema')
      .filter(([key, value]) => {
        const other = Object.entries(file).find(([name]) => name === key)

        return (
          JSON.stringify(variables(String(value))) !==
          JSON.stringify(variables(String(other?.[1])))
        )
      })
      .map(([key]) => key)

    expect(divergent).toEqual([])
  })

  it('every key is used in the code', () => {
    const code = sources(join(root, 'src')).join('\n')
    // `m.key(` is a plain message; `m.key.parts(` is one with markup (`{#link}…{/link}`).
    const dead = keysOf(ptBR).filter(
      (key) => !code.includes(`m.${key}(`) && !code.includes(`m.${key}.parts(`),
    )

    expect(dead).toEqual([])
  })
})
