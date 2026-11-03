import { useSuspenseQuery } from '@tanstack/react-query'
import type * as React from 'react'

import {
  NoticeList,
  NoticeListEmpty,
  NoticeListItems,
} from '#/components/common/notice-list'
import { storefrontNoticesQueryOptions } from '#/integrations/tanstack-query/queries/storefront'
import { m } from '#/paraglide/messages'

export function NoticesPage(): React.JSX.Element {
  const { data: notices } = useSuspenseQuery(storefrontNoticesQueryOptions())

  return (
    <div className="page-container flex flex-col gap-6 py-8 md:py-12">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-title font-extrabold tracking-tight text-balance">
          {m.notices_title()}
        </h1>
        <p className="text-lg text-muted-foreground">{m.notices_intro()}</p>
      </header>
      <NoticeList notices={notices}>
        <NoticeListItems
          as="h2"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        />
        <NoticeListEmpty />
      </NoticeList>
    </div>
  )
}
