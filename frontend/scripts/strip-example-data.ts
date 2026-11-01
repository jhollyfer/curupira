import type { Plugin } from 'vite'

/**
 * Drops the example data from a build that talks to the API.
 *
 * `fromSource({ mock, api })` keeps both bodies in the bundle, and the `mock` bodies
 * import `src/data/*` statically: with `VITE_DATA_SOURCE=api` the neighborhoods, the
 * protocols and the notices written for the demo still shipped to every resident,
 * ~100 KB of code that can never run (`source.ts` picks `api`).
 *
 * Each module under `src/data/` is rewritten to the same export names, all
 * `undefined`. The importers stay valid for the bundler (a missing named export is a
 * build error, not a silent `undefined`) and the data, which is what weighs, is gone.
 * It runs only when the source is `api`, so the `mock` build, `pnpm dev` and the unit
 * tests (which read the real files) are untouched.
 */
const DATA_DIR = '/src/data/'

type ExportNode = Readonly<{
  type: string
  exportKind?: string
  declaration?: Readonly<{
    type: string
    id?: Readonly<{ name: string }>
    declarations?: ReadonlyArray<Readonly<{ id: Readonly<{ name?: string }> }>>
  }> | null
  specifiers?: ReadonlyArray<Readonly<{ exported: Readonly<{ name?: string }> }>>
}>

function namesOf(node: ExportNode): ReadonlyArray<string> {
  if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type') {
    return []
  }

  const fromSpecifiers = (node.specifiers ?? []).map(
    (specifier) => specifier.exported.name ?? '',
  )
  const declaration = node.declaration
  const fromDeclaration = (declaration?.declarations ?? []).map(
    (item) => item.id.name ?? '',
  )

  return [...fromSpecifiers, ...fromDeclaration, declaration?.id?.name ?? '']
    .filter(Boolean)
}

export function stripExampleData(dataSource: string | undefined): Plugin {
  return {
    name: 'curupira:strip-example-data',
    apply: 'build',
    // After the TypeScript transform, so the AST is plain JavaScript.
    enforce: 'post',
    transform(code, id) {
      if (dataSource !== 'api') return null
      if (!id.includes(DATA_DIR) || id.includes('.test.')) return null

      const names = this.parse(code).body.flatMap(namesOf)

      return {
        code: names.map((name) => `export const ${name} = undefined\n`).join(''),
        map: null,
      }
    },
  }
}
