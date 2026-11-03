import { resolve } from 'node:path'

/** Where the `setup` project writes each role's session (ignored by Git: `e2e/.auth/`). */
export const AUTH_FILES = {
  owner: resolve(import.meta.dirname, '..', '.auth', 'owner.json'),
  operator: resolve(import.meta.dirname, '..', '.auth', 'operator.json'),
} as const
