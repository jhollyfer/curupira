import type { Plugin, Rollup } from 'vite'

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

/** The text of a module-export name: an identifier, or a string literal (`export { x as 'a-b' }`). */
function textOf(name: {
  type: string
  name?: string
  value?: unknown
}): string {
  if (typeof name.name === 'string') return name.name
  if (typeof name.value === 'string') return name.value

  return ''
}

type Program = ReturnType<Rollup.PluginContext['parse']>

/**
 * `export const NAME = undefined` for every runtime export of a parsed module (types are
 * already gone: the plugin runs after the TypeScript transform). Pure, so the unit test
 * does not need a bundler.
 */
export function stubExportsOf(program: Program): string {
  const names: Array<string> = []

  for (const node of program.body) {
    if (node.type !== 'ExportNamedDeclaration' || node.exportKind === 'type') {
      continue
    }

    for (const specifier of node.specifiers) {
      names.push(textOf(specifier.exported))
    }

    const declaration = node.declaration
    if (declaration?.type === 'VariableDeclaration') {
      for (const item of declaration.declarations) {
        if (item.id.type === 'Identifier') names.push(item.id.name)
      }
    }
    if (
      declaration?.type === 'FunctionDeclaration' ||
      declaration?.type === 'ClassDeclaration'
    ) {
      if (declaration.id) names.push(declaration.id.name)
    }
  }

  return names.map((name) => `export const ${name} = undefined\n`).join('')
}

export function shouldStrip(dataSource: string | undefined, id: string): boolean {
  if (dataSource !== 'api') return false

  return id.includes(DATA_DIR) && !id.includes('.test.')
}

export function stripExampleData(dataSource: string | undefined): Plugin {
  return {
    name: 'curupira:strip-example-data',
    apply: 'build',
    // After the TypeScript transform, so the AST is plain JavaScript.
    enforce: 'post',
    transform(code, id) {
      if (!shouldStrip(dataSource, id)) return null

      return { code: stubExportsOf(this.parse(code)), map: null }
    },
  }
}
