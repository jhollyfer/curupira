import { env } from '#/env'

/**
 * THE swap point between the example data and the API.
 *
 * Every `queryFn` and `mutationFn` of the public app writes both bodies and hands them
 * here: `mock` reads `src/data/*`, `api` calls `request()`. The screens only ever see
 * the query options, so moving to the API changes `VITE_DATA_SOURCE` (see `env.ts`)
 * and, if a contract moved, the body of one `api` function - never a screen.
 *
 * `async` + `await` and not `Promise.resolve().then(mock)`: a throw inside `mock` (the
 * 404 of an unknown protocol) must reach the caller as the same rejection the API path
 * produces.
 */
type Bodies<T> = Readonly<{
  mock: () => T | Promise<T>
  api: () => Promise<T>
}>

export async function fromSource<T>({ mock, api }: Bodies<T>): Promise<T> {
  if (env.VITE_DATA_SOURCE === 'api') return await api()

  return await mock()
}
