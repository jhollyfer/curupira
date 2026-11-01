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
