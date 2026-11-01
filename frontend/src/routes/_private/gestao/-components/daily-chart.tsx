import type * as React from 'react'

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
const WIDTH = 720
const HEIGHT = 220
const PAD = { top: 12, right: 8, bottom: 28, left: 32 } as const
const PLOT_W = WIDTH - PAD.left - PAD.right
const PLOT_H = HEIGHT - PAD.top - PAD.bottom
/** A tick label every five days; thirty labels at 9px would run into each other. */
const TICK_EVERY = 5

function dayLabel(day: string): string {
  return townDay(day).toLocaleString({ day: '2-digit', month: 'short' })
}

type DailyChartProps = Readonly<{
  series: ReadonlyArray<DailyPoint>
}>

export function DailyChart({ series }: DailyChartProps): React.JSX.Element {
  const peak = seriesPeak(series)
  const ceiling = axisCeiling(peak)
  const step = PLOT_W / series.length
  const barWidth = Math.max(step - 6, 4)
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
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={summary}
        className="h-auto w-full"
      >
        {ticks.map((tick) => {
          const y = PAD.top + PLOT_H - (tick / ceiling) * PLOT_H

          return (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
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
          const height = (point.total / ceiling) * PLOT_H
          const x = PAD.left + index * step + (step - barWidth) / 2
          const y = PAD.top + PLOT_H - height

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
                  y={HEIGHT - 8}
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
          x2={WIDTH - PAD.right}
          y1={PAD.top + PLOT_H}
          y2={PAD.top + PLOT_H}
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
