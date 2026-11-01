import { z } from '@curupira/shared'

import { readLocal, removeLocal, writeLocal } from './local-store'

/**
 * The neighborhood the resident picked once. `localStorage` through `local-store`
 * (versioned key, validated read, `try/catch` inside): it does not exist on SSR, and
 * the home reads it after mount, so the first paint is the same on the server and in
 * the browser (no hydration mismatch).
 */

const THEME = 'neighborhood'

const schema = z.string().nullable()

export function readNeighborhoodId(): string | null {
  return readLocal({ theme: THEME, schema, fallback: null })
}

export function writeNeighborhoodId(id: string): void {
  writeLocal(THEME, id)
}

export function clearNeighborhoodId(): void {
  removeLocal(THEME)
}
