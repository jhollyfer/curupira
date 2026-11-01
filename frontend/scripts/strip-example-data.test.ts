import { parseAst } from 'vite'
import { describe, expect, it } from 'vitest'

import { shouldStrip, stubExportsOf } from './strip-example-data'

describe('stubExportsOf', () => {
  it('keeps every runtime export name and drops the values', () => {
    const code = [
      "import { exampleUuid } from './ids'",
      "export const NEIGHBORHOODS = [{ name: 'Centro' }]",
      'export function schedulesOf() { return exampleUuid }',
      'export class Store {}',
      "const hidden = 'x'",
      'export { hidden as visible }',
    ].join('\n')

    const stub = stubExportsOf(parseAst(code))

    expect(stub.split('\n').filter(Boolean).sort()).toEqual([
      'export const NEIGHBORHOODS = undefined',
      'export const Store = undefined',
      'export const schedulesOf = undefined',
      'export const visible = undefined',
    ])
    expect(stub).not.toContain('Centro')
  })

  it('has nothing to keep in a module with no exports', () => {
    expect(stubExportsOf(parseAst('const a = 1'))).toBe('')
  })
})

describe('shouldStrip', () => {
  const dataFile = '/app/frontend/src/data/neighborhoods.ts'

  it('only strips the example data, and only for the api source', () => {
    expect(shouldStrip('api', dataFile)).toBe(true)
    expect(shouldStrip('mock', dataFile)).toBe(false)
    expect(shouldStrip(undefined, dataFile)).toBe(false)
  })

  it('leaves the rest of the app and the data tests alone', () => {
    expect(shouldStrip('api', '/app/frontend/src/lib/schedule.ts')).toBe(false)
    expect(
      shouldStrip(
        'api',
        '/app/frontend/src/data/management/management.test.ts',
      ),
    ).toBe(false)
  })
})
