// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Table } from './table'
import { TableGrid } from './table-grid'
import { useTable } from './use-table'
import type { TableColumns } from './use-table'

const mobile = vi.hoisted(() => ({ value: false }))

vi.mock('#/hooks/use-mobile', () => ({ useIsMobile: () => mobile.value }))

// The sort header is a router `Link`; a real router is not the subject of this test.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: React.ComponentProps<'a'>) => (
    <a href="/x" className={className}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

type Row = Readonly<{ id: string; name: string; city: string }>

const COLUMNS: TableColumns<Row> = [
  {
    id: 'name',
    header: () => 'Nome',
    meta: { sortKey: 'name', card: 'title' },
    cell: ({ row }) => <a href="/r">{row.original.name}</a>,
  },
  { id: 'city', header: () => 'Cidade', cell: ({ row }) => row.original.city },
  {
    id: 'actions',
    header: () => 'Ações',
    meta: { card: 'actions' },
    cell: () => <button type="button">Abrir</button>,
  },
]

const ROWS: ReadonlyArray<Row> = [
  { id: '1', name: 'Centro', city: 'Benjamin' },
  { id: '2', name: 'Cohab', city: 'Tabatinga' },
]

function Harness(): React.JSX.Element {
  const table = useTable({
    rows: ROWS,
    columns: COLUMNS,
    getRowId: (row) => row.id,
  })

  return (
    <Table to="/x" search={{}}>
      <TableGrid table={table} caption="Bairros" />
    </Table>
  )
}

afterEach(() => {
  cleanup()
  mobile.value = false
})

describe('TableGrid', () => {
  it('draws a table with a column per definition on a wide screen', () => {
    render(<Harness />)

    expect(screen.getByRole('table', { name: 'Bairros' })).toBeTruthy()
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
  })

  it('draws the same rows as a list of cards on a phone', () => {
    mobile.value = true
    render(<Harness />)

    expect(screen.queryByRole('table')).toBeNull()
    const cards = within(
      screen.getByRole('list', { name: 'Bairros' }),
    ).getAllByRole('listitem')
    expect(cards).toHaveLength(2)
  })

  it('puts the title column first, the actions at the corner and labels the rest', () => {
    mobile.value = true
    render(<Harness />)

    const [first] = within(
      screen.getByRole('list', { name: 'Bairros' }),
    ).getAllByRole('listitem')
    expect(within(first).getByRole('link', { name: 'Centro' })).toBeTruthy()
    expect(within(first).getByRole('button', { name: 'Abrir' })).toBeTruthy()
    expect(within(first).getByText('Cidade')).toBeTruthy()
    expect(within(first).getByText('Benjamin')).toBeTruthy()
  })

  it('offers the sortable columns as links above the cards', () => {
    mobile.value = true
    render(<Harness />)

    const group = screen.getByRole('group', { name: 'Ordenar por' })
    expect(within(group).getAllByRole('link')).toHaveLength(1)
  })
})
