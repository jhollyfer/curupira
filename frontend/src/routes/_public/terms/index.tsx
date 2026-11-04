import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/terms/')({
  head: () =>
    pageHead({
      title: m.terms_title(),
      description: m.terms_intro(),
      pathname: '/terms',
    }),
})
