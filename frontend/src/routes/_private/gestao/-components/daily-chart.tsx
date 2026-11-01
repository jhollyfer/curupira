import type * as React from 'react'

import { useIsMobile } from '#/hooks/use-mobile'
import { formatNumber, townDay } from '#/lib/i18n'
import { axisCeiling, seriesPeak } from '#/lib/report-stats'
import type { DailyPoint } from '#/lib/report-stats'
import { m } from '#/paraglide/messages'

/**
 * Reports per day, thirty bars. Hand-drawn SVG instead of a chart library: it is one
 * series of thirty numbers, and a library would add its bundle and its own idea of
 * keyboard access for something this plain.
 *
 * Reading choices (dataviz): a single series so a single hue (`--primary`) with no legend
 * box (the heading names it); thin bars with a gap; recessive grid in `--border`; text in
 * text tokens, never in the series color; the baseline drawn, the zero days kept as zero
 * (a bar-less day is data, not a hole). The numbers are also reachable as a table
 * (`<details>` below) because a picture of bars is not a data source for a screen reader.
 */
/**
 * Two drawings, not one scaled: the 720-unit one shrunk to a 360px phone printed its 11px
 * labels at 5px, unreadable. The compact one is drawn in 360 units, so on a phone one unit
 * is one pixel and the labels keep their size. The bars get thinner, the days stay thirty.
 */
const SIZES = {
  wide: { width: 720, height: 220, gap: 6 },
  compact: { width: 360, height: 200, gap: 2 },
} as const
const PAD = { top: 12, right: 8, bottom: 28, left: 28 } as const
/** A tick label every five days; thirty labels at 9px would run into each other. */
const TICK_EVERY = 5

function dayLabel(day: string): string {
  return townDay(day).toLocaleString({ day: '2-digit', month: 'short' })
}

type DailyChartProps = Readonly<{
  series: ReadonlyArray<DailyPoint>
}>

export function DailyChart({ series }: DailyChartProps): React.JSX.Element {
  const isMobile = useIsMobile()
  let size: (typeof SIZES)[keyof typeof SIZES] = SIZES.wide
  if (isMobile) size = SIZES.compact
  const { width, height: chartHeight } = size
  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = chartHeight - PAD.top - PAD.bottom
  const peak = seriesPeak(series)
  const ceiling = axisCeiling(peak)
  const step = plotWidth / series.length
  const barWidth = Math.max(step - size.gap, 3)
  const ticks = [0, ceiling / 2, ceiling]
  const peakPoint = series.find((point) => point.total === peak)

  let summary = m.panel_overview_chart_empty()
  if (peak > 0 && peakPoint) {
    summary = m.panel_overview_chart_summary({
      peak: formatNumber(peak),
      day: dayLabel(peakPoint.day),
    })
  }

  return (
    <figure className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        role="img"
        aria-label={summary}
        className="h-auto w-full max-w-4xl"
      >
        {ticks.map((tick) => {
          const y = PAD.top + plotHeight - (tick / ceiling) * plotHeight

          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y + 3.5}
                textAnchor="end"
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {series.map((point, index) => {
          const height = (point.total / ceiling) * plotHeight
          const x = PAD.left + index * step + (step - barWidth) / 2
          const y = PAD.top + plotHeight - height

          return (
            <g key={point.day}>
              <title>
                {m.panel_overview_chart_tooltip({
                  day: dayLabel(point.day),
                  count: point.total,
                })}
              </title>
              {point.total > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={height}
                  rx={2}
                  fill="var(--primary)"
                />
              )}
              {index % TICK_EVERY === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {dayLabel(point.day)}
                </text>
              )}
            </g>
          )
        })}

        <line
          x1={PAD.left}
          x2={width - PAD.right}
          y1={PAD.top + plotHeight}
          y2={PAD.top + plotHeight}
          stroke="var(--muted-foreground)"
          strokeWidth={1}
        />
      </svg>

      <figcaption className="text-sm text-muted-foreground">
        {summary}
      </figcaption>

      <details className="text-sm">
        <summary className="inline-flex min-h-8 cursor-pointer items-center rounded-md px-1 font-medium text-foreground underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          {m.panel_overview_chart_table()}
        </summary>
        <table className="mt-2 w-full max-w-md border-collapse text-left tabular-nums">
          <caption className="sr-only">
            {m.panel_overview_chart_title()}
          </caption>
          <thead>
            <tr className="border-b">
              <th scope="col" className="py-1.5 pr-4 font-medium">
                {m.panel_overview_chart_day()}
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                {m.panel_overview_chart_reports()}
              </th>
            </tr>
          </thead>
          <tbody>
            {series.map((point) => (
              <tr key={point.day} className="border-b border-border/60">
                <th scope="row" className="py-1 pr-4 font-normal">
                  {dayLabel(point.day)}
                </th>
                <td className="py-1 text-right">{point.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
