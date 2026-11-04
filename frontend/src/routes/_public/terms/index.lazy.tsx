import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import {
  ProsePage,
  ProsePageNotice,
  ProsePageSection,
} from '#/components/common/prose-page'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/terms/')({
  component: TermsPage,
})

function TermsPage(): React.JSX.Element {
  return (
    <ProsePage title={m.terms_title()} intro={m.terms_intro()}>
      <ProsePageSection title={m.terms_use_title()}>
        <p>{m.terms_use_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.terms_faith_title()}>
        <p>{m.terms_faith_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.terms_emergency_title()}>
        <p>{m.terms_emergency_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.terms_liability_title()}>
        <p>{m.terms_liability_text()}</p>
      </ProsePageSection>
      <ProsePageNotice>{m.legal_sample()}</ProsePageNotice>
    </ProsePage>
  )
}
