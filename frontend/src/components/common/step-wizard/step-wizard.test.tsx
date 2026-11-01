// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  StepWizard,
  StepWizardActions,
  StepWizardBack,
  StepWizardFinish,
  StepWizardIndicator,
  StepWizardNext,
  StepWizardPanel,
} from './index'

afterEach(cleanup)

function Harness({ canContinue = true }: Readonly<{ canContinue?: boolean }>) {
  const [step, setStep] = React.useState(0)

  return (
    <StepWizard titles={['Tipo', 'Foto', 'Envio']} value={step} onValueChange={setStep}>
      <StepWizardIndicator />
      <StepWizardPanel step={0} title="Primeiro">
        <p>conteúdo um</p>
      </StepWizardPanel>
      <StepWizardPanel step={1} title="Segundo">
        <p>conteúdo dois</p>
      </StepWizardPanel>
      <StepWizardPanel step={2} title="Terceiro">
        <p>conteúdo três</p>
      </StepWizardPanel>
      <StepWizardActions>
        <StepWizardBack />
        <StepWizardNext canContinue={canContinue} />
        <StepWizardFinish>
          <button type="submit">Enviar</button>
        </StepWizardFinish>
      </StepWizardActions>
    </StepWizard>
  )
}

describe('StepWizard', () => {
  it('shows only the current panel and marks it as the current step', () => {
    render(<Harness />)

    expect(screen.getByText('conteúdo um')).toBeTruthy()
    expect(screen.queryByText('conteúdo dois')).toBeNull()
    expect(
      screen.getByText('Tipo').closest('li')?.getAttribute('aria-current'),
    ).toBe('step')
  })

  it('moves forward and back, and moves focus to the new heading', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /continuar|next/i }))

    expect(screen.getByText('conteúdo dois')).toBeTruthy()
    expect(document.activeElement?.textContent).toBe('Segundo')

    await user.click(screen.getByRole('button', { name: /voltar|back/i }))
    expect(screen.getByText('conteúdo um')).toBeTruthy()
  })

  it('swaps Next for the finish action on the last step', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: /continuar|next/i }))
    await user.click(screen.getByRole('button', { name: /continuar|next/i }))

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /continuar|next/i })).toBeNull()
  })

  it('blocks Next while the step is not valid', () => {
    render(<Harness canContinue={false} />)

    expect(
      screen
        .getByRole('button', { name: /continuar|next/i })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('throws a clear error outside the provider', () => {
    expect(() => render(<StepWizardBack />)).toThrow(/within `StepWizard`/)
  })
})
