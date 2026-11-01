// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  NeighborhoodPicker,
  NeighborhoodPickerList,
  NeighborhoodPickerSummary,
} from './index'

afterEach(cleanup)

const NEIGHBORHOODS = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Centro', slug: 'centro', latitude: null, longitude: null },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Cohab', slug: 'cohab', latitude: null, longitude: null },
]

function Harness({ initial }: Readonly<{ initial: string | null }>) {
  const [value, setValue] = React.useState(initial)

  return (
    <NeighborhoodPicker
      neighborhoods={NEIGHBORHOODS}
      value={value}
      onValueChange={setValue}
    >
      <NeighborhoodPickerSummary />
      <NeighborhoodPickerList />
    </NeighborhoodPicker>
  )
}

describe('NeighborhoodPicker', () => {
  it('shows the question and the choices while nothing is chosen', () => {
    render(<Harness initial={null} />)

    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /trocar/i })).toBeNull()
  })

  it('collapses to the summary after choosing', async () => {
    const user = userEvent.setup()
    render(<Harness initial={null} />)

    await user.click(screen.getByText('Cohab'))

    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByText('Cohab')).toBeTruthy()
    expect(screen.getByRole('button', { name: /trocar/i })).toBeTruthy()
  })

  it('reopens the choices from the summary', async () => {
    const user = userEvent.setup()
    render(<Harness initial={NEIGHBORHOODS[0]?.id ?? null} />)

    await user.click(screen.getByRole('button', { name: /trocar/i }))

    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })
})
