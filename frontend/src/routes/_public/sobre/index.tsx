import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/sobre/')({
  head: () =>
    pageHead({
      title: m.about_title(),
      description: m.about_intro(),
      pathname: '/sobre',
    }),
})
