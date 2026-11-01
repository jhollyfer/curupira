import { z } from '@curupira/shared'

import { readLocal, writeLocal } from './local-store'

/**
 * The protocols this device sent, so "Acompanhar" can offer them with one tap. Only
 * the code is kept, never the content: the report is anonymous by default and this
 * device should not hold more about it than the resident was told.
 */

const THEME = 'report-history'
const LIMIT = 10

const schema = z.array(z.string())

/**
 * The list as one string, for `useSyncExternalStore`: its snapshot must be a stable
 * value, and a fresh array on every read would loop forever. Protocols never contain
 * `|`, so it is a safe separator.
 */
export function readProtocolsSnapshot(): string {
  return readProtocols().join('|')
}

export function readProtocols(): Array<string> {
  return readLocal({ theme: THEME, schema, fallback: [] })
}

/** Newest first, no repeats, capped. */
export function rememberProtocol(protocol: string): Array<string> {
  const next = [
    protocol,
    ...readProtocols().filter((item) => item !== protocol),
  ].slice(0, LIMIT)

  writeLocal(THEME, next)

  return next
}
