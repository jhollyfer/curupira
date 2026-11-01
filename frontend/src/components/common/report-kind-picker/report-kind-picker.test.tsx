// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  ReportKindPicker,
  ReportKindPickerLegend,
  ReportKindPickerOption,
} from './index'

afterEach(cleanup)

function Harness() {
  const [value, setValue] = React.useState<'BURNING' | 'DUMPING' | undefined>()

  return (
    <ReportKindPicker name="kind" value={value} onValueChange={setValue}>
      <ReportKindPickerLegend>O que você viu?</ReportKindPickerLegend>
      <ReportKindPickerOption kind="BURNING" />
      <ReportKindPickerOption kind="DUMPING" />
    </ReportKindPicker>
  )
}

describe('ReportKindPicker', () => {
  it('is a named radio group with one radio per kind', () => {
    render(<Harness />)

    expect(screen.getByRole('group', { name: 'O que você viu?' })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('selects a kind by its card', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByText('Queimada'))

    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: /queimada/i }).checked,
    ).toBe(true)
  })

  it('throws outside the provider', () => {
    expect(() => render(<ReportKindPickerOption kind="BURNING" />)).toThrow(
      /within `ReportKindPicker`/,
    )
  })
})
