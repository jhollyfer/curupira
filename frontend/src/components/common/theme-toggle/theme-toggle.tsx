import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { useTheme } from '#/components/common/theme-provider'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

/**
 * Toggles between light and dark (public header and panel header).
 *
 * Both icons stay **always mounted**, stacked, and the switch is `rotate` + `scale`
 * from one to the other. Whoever decides which one shows is the `dark` class on
 * `<html>`, which the `ThemeProvider` resolves before hydration - so there is no
 * `if (!mounted) return null` and no wrong icon on the server's first render.
 */
export function ThemeToggle(): React.JSX.Element {
  const { setTheme } = useTheme('ThemeToggle')

  function toggle(): void {
    // The resolved theme is what the page shows now (the `<html>` class): with
    // `system` the saved preference does not say whether it is light or dark.
    let next: 'light' | 'dark' = 'dark'
    if (document.documentElement.classList.contains('dark')) next = 'light'

    setTheme(next)
  }

  return (
    <Button
      data-slot="theme-toggle"
      variant="ghost"
      size="icon-touch"
      onClick={toggle}
      aria-label={m.common_toggle_theme()}
      className="relative overflow-hidden"
    >
      <SunIcon
        weight="fill"
        className="absolute rotate-90 scale-0 transition-transform duration-300 motion-reduce:transition-none dark:rotate-0 dark:scale-100"
      />
      <MoonIcon
        weight="fill"
        className="absolute rotate-0 scale-100 transition-transform duration-300 motion-reduce:transition-none dark:-rotate-90 dark:scale-0"
      />
    </Button>
  )
}
