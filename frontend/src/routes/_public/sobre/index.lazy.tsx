import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { ProsePage, ProsePageNotice, ProsePageSection } from '#/components/common/prose-page'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/sobre/')({
  component: AboutPage,
})

function AboutPage(): React.JSX.Element {
  return (
    <ProsePage title={m.about_title()} intro={m.about_intro()}>
      <ProsePageSection title={m.about_what_title()}>
        <p>{m.about_what_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.about_how_title()}>
        <p>{m.about_how_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.about_offline_title()}>
        <p>{m.about_offline_text()}</p>
      </ProsePageSection>
      <ProsePageNotice>{m.about_sample()}</ProsePageNotice>
    </ProsePage>
  )
}
