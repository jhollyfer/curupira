import type { ReportKind, ReportStatus } from '@curupira/shared'
import L from 'leaflet'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { REPORT_KIND_ICONS } from '#/lib/icons'

/**
 * Leaflet draws markers from HTML strings, not from React, so the Phosphor icon is
 * rendered to markup once per kind. The color lives in CSS (`.report-pin[data-kind]`
 * in `styles.css`, from the tokens), so a theme change needs no new icon.
 * The default image marker is not used: its PNG paths break under bundlers.
 */
export function reportPinIcon(
  kind: ReportKind,
  status: ReportStatus | undefined,
  size: 'normal' | 'picker' = 'normal',
): L.DivIcon {
  const Icon = REPORT_KIND_ICONS[kind]
  const markup = renderToStaticMarkup(
    createElement(Icon, { weight: 'fill', size: size === 'picker' ? 26 : 18 }),
  )
  const classes = size === 'picker' ? 'report-pin report-pin-picker' : 'report-pin'
  const statusAttribute = status ? ` data-status="${status}"` : ''
  const pixels = size === 'picker' ? 44 : 32

  return L.divIcon({
    className: '',
    html: `<span class="${classes}" data-kind="${kind}"${statusAttribute}>${markup}</span>`,
    iconSize: [pixels, pixels],
    iconAnchor: [pixels / 2, pixels / 2],
    popupAnchor: [0, -pixels / 2],
  })
}
