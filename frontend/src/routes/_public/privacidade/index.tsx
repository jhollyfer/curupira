import { createFileRoute } from '@tanstack/react-router'

import { pageHead } from '#/lib/page-head'
import { m } from '#/paraglide/messages'

export const Route = createFileRoute('/_public/privacidade/')({
  head: () =>
    pageHead({
      title: m.privacy_title(),
      description: m.privacy_intro(),
      pathname: '/privacidade',
    }),
})
