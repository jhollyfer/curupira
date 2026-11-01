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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
          {m.notices_title()}
        </h1>
        <p className="text-lg text-muted-foreground">{m.notices_intro()}</p>
      </header>
      <NoticeList notices={notices}>
        <NoticeListItems as="h2" />
        <NoticeListEmpty />
      </NoticeList>
    </div>
  )
}
