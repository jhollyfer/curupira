// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { NoticeList, NoticeListEmpty, NoticeListItems } from './index'

afterEach(cleanup)

const NOTICES = [1, 2, 3].map((n) => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  title: `Aviso ${n}`,
  body: 'corpo',
  startsAt: '2026-11-01T00:00:00-04:00',
  endsAt: null,
}))

describe('NoticeList', () => {
  it('shows only the first N when limited', () => {
    render(
      <NoticeList notices={NOTICES}>
        <NoticeListItems limit={2} />
      </NoticeList>,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByText('Aviso 3')).toBeNull()
  })

  it('writes the empty line only when there is no notice', () => {
    const { rerender } = render(
      <NoticeList notices={[]}>
        <NoticeListEmpty />
      </NoticeList>,
    )
    expect(screen.getByText(/nenhum aviso/i)).toBeTruthy()

    rerender(
      <NoticeList notices={NOTICES}>
        <NoticeListEmpty />
      </NoticeList>,
    )
    expect(screen.queryByText(/nenhum aviso/i)).toBeNull()
  })
})
