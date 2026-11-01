import { TranslateIcon } from '@phosphor-icons/react'
import type * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { m } from '#/paraglide/messages'
import { getLocale, isLocale, locales, setLocale } from '#/paraglide/runtime'
import type { Locale } from '#/paraglide/runtime'

/**
 * Each language in its own name, not translated: whoever looks for Spanish looks for
 * "Español", not for "Espanhol" (pattern from the Mangangá switcher).
 */
export const LOCALE_NATIVE_NAMES = {
  'pt-BR': 'Português',
  es: 'Español',
  en: 'English',
} satisfies Record<Locale, string>

const SHORT_NAMES = {
  'pt-BR': 'PT',
  es: 'ES',
  en: 'EN',
} satisfies Record<Locale, string>

/**
 * The language switch (_standards/i18n.md §2). Paraglide's `setLocale` leads to the
 * same page in the other language - the URL is the source of truth - and the reload
 * is the point: the server answers in the chosen language from the first byte, with
 * `lang`, title, canonical and hreflang right. The rest (API messages, validation
 * messages) follows from it.
 */
export function LocaleSwitch(): React.JSX.Element {
  const locale = getLocale()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button data-slot="locale-switch" variant="outline" size="touch" />
        }
      >
        <TranslateIcon aria-hidden="true" />
        {/* The accessible name must contain the visible text (WCAG 2.5.3): "Idioma PT". */}
        <span className="sr-only">{m.locale_switch_label()} </span>
        {SHORT_NAMES[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{m.locale_switch_label()}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value: string) => {
              if (isLocale(value)) void setLocale(value)
            }}
          >
            {locales.map((item) => (
              <DropdownMenuRadioItem
                key={item}
                value={item}
                lang={item}
                className="min-h-11 text-base"
              >
                {LOCALE_NATIVE_NAMES[item]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
