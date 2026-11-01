import type { StorefrontNoticeShowResponse } from '@curupira/shared'
import * as React from 'react'

export type NoticeListContextValue = {
  notices: ReadonlyArray<StorefrontNoticeShowResponse>
}

const NoticeListContext = React.createContext<NoticeListContextValue | null>(
  null,
)

export const NoticeListProvider = NoticeListContext.Provider

export function useNoticeListContext(consumer: string): NoticeListContextValue {
  const context = React.use(NoticeListContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`NoticeList\``)
  }

  return context
}
