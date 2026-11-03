import type * as React from 'react'

import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

const MAIYU_URL = 'https://maiyu.com.br'

type MaiyuCreditProps = Readonly<{ className?: string }>

/**
 * The credit of every footer: only "Developed by Maiyu", with the name as the link
 * (`_standards/frontend.md` §8, `DECISIONS.md` #277). No tagline, year or other line of
 * authorship; the color comes from where it is used (`className`). The sentence is one
 * message, `common_maiyu_credit`, whose `{#link}…{/link}` marks the link in each language.
 */
export function MaiyuCredit({
  className,
}: MaiyuCreditProps): React.JSX.Element {
  const nodes: Array<React.ReactNode> = []
  let inLink = false

  for (const [index, part] of m.common_maiyu_credit.parts({}).entries()) {
    if (part.type === 'markup-start') inLink = true
    if (part.type === 'markup-end') inLink = false
    if (part.type !== 'text') continue

    if (!inLink) {
      nodes.push(part.value)
      continue
    }
    nodes.push(
      <a
        key={index}
        href={MAIYU_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 min-w-11 items-center justify-center font-semibold underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-4 focus-visible:ring-current/50"
      >
        {part.value}
      </a>,
    )
  }

  return (
    <p className={cn('inline-flex flex-wrap items-center gap-x-1', className)}>
      {nodes}
    </p>
  )
}
