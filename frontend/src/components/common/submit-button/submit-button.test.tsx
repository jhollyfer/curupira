// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { SubmitButton } from './index'

afterEach(cleanup)

describe('SubmitButton', () => {
  it('is a submit and is enabled by default', () => {
    render(<SubmitButton>Salvar</SubmitButton>)
    const button = screen.getByRole('button', { name: 'Salvar' })

    expect(button.getAttribute('type')).toBe('submit')
    expect(button.hasAttribute('disabled')).toBe(false)
  })

  it('when the mutation is in flight, locks and shows the spinner', () => {
    render(<SubmitButton isPending>Salvar</SubmitButton>)
    const button = screen.getByRole('button', { name: /Salvar/ })

    expect(button.hasAttribute('disabled')).toBe(true)
    expect(button.querySelector('svg, [role="status"]')).toBeTruthy()
  })

  it('locks with explicit disabled too', () => {
    render(<SubmitButton disabled>Salvar</SubmitButton>)

    expect(
      screen.getByRole('button', { name: 'Salvar' }).hasAttribute('disabled'),
    ).toBe(true)
  })
})
