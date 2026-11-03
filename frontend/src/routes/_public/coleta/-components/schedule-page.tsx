import { CalendarPlusIcon } from '@phosphor-icons/react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { DateTime } from 'luxon'
import type * as React from 'react'

import {
  NeighborhoodPicker,
  NeighborhoodPickerClosed,
  NeighborhoodPickerList,
  NeighborhoodPickerSummary,
} from '#/components/common/neighborhood-picker'
import {
  WasteCalendar,
  WasteCalendarDetail,
  WasteCalendarLegend,
  WasteCalendarMonth,
} from '#/components/common/waste-calendar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useResidentNeighborhood } from '#/hooks/use-resident-neighborhood'
import {
  storefrontNeighborhoodsQueryOptions,
  storefrontSchedulesQueryOptions,
} from '#/integrations/tanstack-query/queries/storefront'
import { TOWN_TIME_ZONE } from '#/lib/i18n'
import { buildIcs } from '#/lib/ics'
import { WASTE_TYPE_LABELS } from '#/lib/labels'
import { m } from '#/paraglide/messages'

const route = getRouteApi('/_public/coleta/')

/** Hands a text file to the browser's download, with no server round trip. */
function download(name: string, content: string): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/calendar;charset=utf-8' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  // Revoked right after the click: the browser has already taken the blob.
  URL.revokeObjectURL(url)
}

export function SchedulePage(): React.JSX.Element {
  const { now } = route.useLoaderData()
  const search = route.useSearch()
  const navigate = useNavigate({ from: '/coleta/' })
  const { data: neighborhoods } = useSuspenseQuery(
    storefrontNeighborhoodsQueryOptions(),
  )
  const { neighborhoodId, choose } = useResidentNeighborhood()
  const schedules = useQuery({
    ...storefrontSchedulesQueryOptions(neighborhoodId ?? undefined),
    enabled: typeof neighborhoodId === 'string',
  })
  const passes = schedules.data ?? []
  const clock = DateTime.fromISO(now, { zone: TOWN_TIME_ZONE })
  const month = search.month ?? clock.toFormat('yyyy-LL')
  const chosen = neighborhoods.find((item) => item.id === neighborhoodId)

  function exportCalendar(): void {
    if (!chosen) return

    download(
      `coleta-${chosen.slug}.ics`,
      buildIcs({
        neighborhoodName: chosen.name,
        passes,
        from: clock,
        now: DateTime.now(),
        summary: (pass) =>
          m.schedule_event_summary({
            type: WASTE_TYPE_LABELS[pass.wasteType](),
          }),
        calendarName: m.schedule_calendar_name({ neighborhood: chosen.name }),
      }),
    )
  }

  return (
    <div className="page-container flex flex-col gap-6 py-8 md:py-12">
      <header className="flex max-w-3xl flex-col gap-2">
        <h1 className="text-title font-extrabold tracking-tight text-balance">
          {m.schedule_title()}
        </h1>
        <p className="text-lg text-muted-foreground">{m.schedule_intro()}</p>
      </header>

      {neighborhoodId === undefined && (
        <Skeleton
          role="status"
          aria-label={m.common_loading()}
          className="h-96 w-full rounded-2xl"
        />
      )}

      {neighborhoodId !== undefined && (
        <NeighborhoodPicker
          neighborhoods={neighborhoods}
          value={neighborhoodId}
          onValueChange={choose}
        >
          <NeighborhoodPickerSummary />
          <NeighborhoodPickerList />
          <NeighborhoodPickerClosed>
            {schedules.data && (
              <WasteCalendar
                passes={passes}
                now={now}
                className="gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]"
              >
                <WasteCalendarMonth
                  month={month}
                  onMonthChange={(next) =>
                    navigate({ search: { month: next }, replace: true })
                  }
                />
                {/* The month on the left, what it means on the right: the aside stays under
                    the header while a long month scrolls, so the selected day is always
                    in sight from `lg`. */}
                <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                  <WasteCalendarDetail />
                  <Button
                    type="button"
                    variant="outline"
                    size="touch"
                    className="self-start"
                    onClick={exportCalendar}
                  >
                    <CalendarPlusIcon aria-hidden="true" />
                    {m.schedule_export()}
                  </Button>
                  <WasteCalendarLegend />
                </div>
              </WasteCalendar>
            )}
            {!schedules.data && (
              <Skeleton
                role="status"
                aria-label={m.common_loading()}
                className="h-96 w-full rounded-2xl"
              />
            )}
          </NeighborhoodPickerClosed>
        </NeighborhoodPicker>
      )}
    </div>
  )
}
