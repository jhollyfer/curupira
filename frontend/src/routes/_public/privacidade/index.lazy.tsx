import { createLazyFileRoute } from '@tanstack/react-router'
import type * as React from 'react'

import { ProsePage, ProsePageNotice, ProsePageSection } from '#/components/common/prose-page'
import { m } from '#/paraglide/messages'

export const Route = createLazyFileRoute('/_public/privacidade/')({
  component: PrivacyPage,
})

function PrivacyPage(): React.JSX.Element {
  return (
    <ProsePage title={m.privacy_title()} intro={m.privacy_intro()}>
      <ProsePageSection title={m.privacy_anonymous_title()}>
        <p>{m.privacy_anonymous_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.privacy_data_title()}>
        <p>{m.privacy_data_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.privacy_contact_title()}>
        <p>{m.privacy_contact_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.privacy_device_title()}>
        <p>{m.privacy_device_text()}</p>
      </ProsePageSection>
      <ProsePageSection title={m.privacy_rights_title()}>
        <p>{m.privacy_rights_text()}</p>
      </ProsePageSection>
      <ProsePageNotice>{m.legal_sample()}</ProsePageNotice>
    </ProsePage>
  )
}
