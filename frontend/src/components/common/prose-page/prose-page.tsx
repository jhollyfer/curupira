import type * as React from 'react'

import { cn } from '#/lib/cn'

type ProsePageProps = Readonly<{
  title: string
  intro?: string
  className?: string
  children: React.ReactNode
}>

/**
 * The frame of a text page (about, privacy, terms): title, a line of context and
 * sections with a readable measure (65 characters). One component for the three pages
 * so the legal text reads the same everywhere.
 */
export function ProsePage({
  title,
  intro,
  className,
  children,
}: ProsePageProps): React.JSX.Element {
  return (
    <article
      data-slot="prose-page"
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8',
        className,
      )}
    >
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-balance">
          {title}
        </h1>
        {intro && <p className="text-lg text-pretty text-muted-foreground">{intro}</p>}
      </header>
      {children}
    </article>
  )
}

type ProsePageSectionProps = Readonly<{
  title: string
  children: React.ReactNode
}>

/** A titled block of paragraphs. */
export function ProsePageSection({
  title,
  children,
}: ProsePageSectionProps): React.JSX.Element {
  return (
    <section data-slot="prose-page-section" className="flex flex-col gap-2">
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-lg leading-relaxed text-pretty">
        {children}
      </div>
    </section>
  )
}

/** The reminder that the text is a draft to be reviewed by the city hall. */
export function ProsePageNotice({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <p
      data-slot="prose-page-notice"
      className="rounded-2xl bg-muted p-4 text-base text-muted-foreground"
    >
      {children}
    </p>
  )
}
