import type { Page } from '@playwright/test'

/** The widths the resident app is held to, phone to wide monitor (height is the usual one). */
export const VIEWPORTS = [
  { name: 'phone-360', width: 360, height: 740 },
  { name: 'phone-412', width: 412, height: 915 },
  { name: 'phone-landscape', width: 740, height: 360 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
] as const

/** The public routes, plus the sign-in and a missing page (also part of the app a resident can reach). */
export const PUBLIC_ROUTES = [
  '/',
  '/coleta',
  '/denunciar',
  '/acompanhar',
  '/mapa',
  '/avisos',
  '/sobre',
  '/privacidade',
  '/termos',
  '/sign-in',
  '/rota-que-nao-existe',
] as const

/**
 * How many pixels the page is wider than the window. Zero is the goal: a horizontal page
 * scroll on a phone is a layout that did not fit. The only scrolling the app wants is
 * inside a region (the strip of days), which does not widen the document.
 *
 * `width` is the viewport the test asked for, and it is compared on purpose besides
 * `innerWidth`: on a mobile-emulated page (`isMobile`) the browser grows the layout
 * viewport to fit overflowing content, so `innerWidth` follows the overflow and
 * `scrollWidth <= innerWidth` would pass on a page that is in fact wider than the phone.
 */
export function horizontalOverflow(page: Page, width: number): Promise<number> {
  return page.evaluate(
    (expected) =>
      document.documentElement.scrollWidth -
      Math.min(window.innerWidth, expected),
    width,
  )
}

/**
 * The interactive elements on screen smaller than 44x44 CSS px, named for the failure
 * message. Left out on purpose, as WCAG 2.5.8 does: links inside a line of text (inline),
 * the visually hidden radio inputs (their label is the target) and the skip link while
 * it is off screen.
 */
export function smallTouchTargets(page: Page): Promise<Array<string>> {
  return page.evaluate(() => {
    const MIN = 43.5
    const selector =
      'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=radio], [role=tab], summary'
    const small: Array<string> = []

    for (const element of document.querySelectorAll(selector)) {
      const box = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      const hidden =
        style.visibility === 'hidden' ||
        style.display === 'none' ||
        box.width <= 1.5 ||
        box.height <= 1.5
      const inline = element.tagName === 'A' && style.display === 'inline'
      const skipLink = element.classList.contains('skip-link')

      if (hidden || inline || skipLink) continue
      if (box.width >= MIN && box.height >= MIN) continue

      const label = element.getAttribute('aria-label')
      const name = (label ?? element.textContent).trim().slice(0, 30)
      small.push(
        `${element.tagName.toLowerCase()} "${name}" ${Math.round(box.width)}x${Math.round(box.height)}`,
      )
    }

    return small
  })
}
