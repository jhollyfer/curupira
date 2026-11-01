import * as React from 'react'

import type { Coordinate } from '#/lib/geo'

export type ReportMapContextValue = {
  center: Coordinate
  zoom: number
  /** The accessible name of the map region. */
  label: string
}

const ReportMapContext = React.createContext<ReportMapContextValue | null>(null)

export const ReportMapProvider = ReportMapContext.Provider

export function useReportMapContext(consumer: string): ReportMapContextValue {
  const context = React.use(ReportMapContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used within \`ReportMap\``)
  }

  return context
}
