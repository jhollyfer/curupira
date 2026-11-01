import type { StorefrontNoticeShowResponse } from '@curupira/shared'
import * as React from 'react'

import { cn } from '#/lib/cn'

import { NoticeListProvider } from './notice-list-context'

type NoticeListProps = Readonly<{
  notices: ReadonlyArray<StorefrontNoticeShowResponse>
  className?: string
  children: React.ReactNode
}>

/**
 * The city hall's notices. The home shows the first two and a link to all; the notices
 * page shows everything; both are the same parts with a different `limit`.
 */
export function NoticeList({
  notices,
  className,
  children,
}: NoticeListProps): React.JSX.Element {
  return (
    <NoticeListProvider value={{ notices }}>
      <div data-slot="notice-list" className={cn('flex flex-col gap-3', className)}>
        {children}
      </div>
    </NoticeListProvider>
  )
}
