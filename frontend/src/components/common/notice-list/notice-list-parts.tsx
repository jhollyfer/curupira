import { MegaphoneIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { cn } from '#/lib/cn'
import { formatTownDate } from '#/lib/i18n'
import { m } from '#/paraglide/messages'

import { useNoticeListContext } from './notice-list-context'

type NoticeListItemsProps = Readonly<{
  /** Shows only the first N; absent shows all. */
  limit?: number
  /**
   * The heading level of each notice: `h3` under a section's `h2` (the home), `h2` right
   * under the page's `h1` (the notices page). A skipped level breaks the outline that
   * screen reader users navigate by.
   */
  as?: 'h2' | 'h3'
  /** Layout of the list: a column by default; a screen with room passes a grid. */
  className?: string
}>

/** The notices as a list of cards. Renders nothing when there is nothing to show. */
export function NoticeListItems({
  limit,
  as: Heading = 'h3',
  className,
}: NoticeListItemsProps): React.JSX.Element | null {
  const { notices } = useNoticeListContext('NoticeListItems')
  const shown = notices.slice(0, limit)

  if (shown.length === 0) return null

  return (
    <ul
      data-slot="notice-list-items"
      className={cn('flex flex-col gap-3', className)}
    >
      {shown.map((notice) => (
        <li
          key={notice.id}
          className="flex gap-4 rounded-2xl bg-card p-4 shadow-card"
        >
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"
          >
            <MegaphoneIcon className="size-6" weight="fill" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <Heading className="text-lg leading-snug font-bold text-balance">
              {notice.title}
            </Heading>
            <p className="text-base text-pretty text-muted-foreground">
              {notice.body}
            </p>
            {notice.endsAt && (
              <p className="text-sm font-medium text-muted-foreground">
                {m.notice_until({
                  date: formatTownDate(notice.endsAt, {
                    day: 'numeric',
                    month: 'long',
                  }),
                })}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

/** The text for "no notice now": a quiet line, not an empty box. */
export function NoticeListEmpty(): React.JSX.Element | null {
  const { notices } = useNoticeListContext('NoticeListEmpty')

  if (notices.length > 0) return null

  return (
    <p
      data-slot="notice-list-empty"
      className="rounded-2xl bg-muted p-4 text-base text-muted-foreground"
    >
      {m.notice_empty()}
    </p>
  )
}
