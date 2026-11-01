import {
  CameraIcon,
  ListChecksIcon,
  MapPinIcon,
  PhoneCallIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type * as React from 'react'

import {
  NeighborhoodPicker,
  NeighborhoodPickerClosed,
  NeighborhoodPickerList,
  NeighborhoodPickerSummary,
} from '#/components/common/neighborhood-picker'
import {
  NoticeList,
  NoticeListEmpty,
  NoticeListItems,
} from '#/components/common/notice-list'
import {
  WasteCalendar,
  WasteCalendarStrip,
} from '#/components/common/waste-calendar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useResidentNeighborhood } from '#/hooks/use-resident-neighborhood'
import {
  storefrontNeighborhoodsQueryOptions,
  storefrontNoticesQueryOptions,
  storefrontSchedulesQueryOptions,
} from '#/integrations/tanstack-query/queries/storefront'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { NextCollection } from './next-collection'

const route = getRouteApi('/_public/')

/**
 * The call to action on the deep green band: always the light fill with dark green text,
 * in both themes. The `secondary` token flips dark in dark mode and would sink into the
 * band, and this is the one button the whole page exists for.
 */
const STAGE_CTA =
  'bg-stage-foreground text-stage hover:bg-stage-foreground/90 hover:text-stage'

/**
 * The home: hero with the question, the next collection of the resident's
 * neighborhood, the 14-day strip, the notices, the report call and how it works.
 *
 * The first time, the card in the hero asks for the neighborhood; afterwards the same
 * card answers. Until the device has been read (`neighborhoodId === undefined`) it is a
 * skeleton of the same size, so a returning resident never sees the question flash.
 */
export function HomePage(): React.JSX.Element {
  const { now } = route.useLoaderData()
  const { data: neighborhoods } = useSuspenseQuery(
    storefrontNeighborhoodsQueryOptions(),
  )
  const { data: notices } = useSuspenseQuery(storefrontNoticesQueryOptions())
  const { neighborhoodId, choose } = useResidentNeighborhood()
  const schedules = useQuery({
    ...storefrontSchedulesQueryOptions(neighborhoodId ?? undefined),
    enabled: typeof neighborhoodId === 'string',
  })
  const passes = schedules.data ?? []
  const hasSchedule = typeof neighborhoodId === 'string' && schedules.data

  return (
    <>
      <section className="stage-band">
        {/* Two columns from `md`: the question on the left, the answer (the next collection)
            on the right. The ratio leans to the question from `lg` so the title keeps
            two lines on a wide monitor instead of a thin column. */}
        <div className="page-container grid gap-8 py-10 md:grid-cols-2 md:items-center md:gap-10 md:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:py-20">
          <div className="flex flex-col gap-5">
            <h1 className="text-fluid-display font-extrabold tracking-tight text-balance">
              {m.home_title()}
            </h1>
            <p className="max-w-prose text-lg text-pretty text-stage-muted lg:text-xl">
              {m.home_subtitle()}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="touch-lg"
                variant="secondary"
                className={STAGE_CTA}
                render={<Link to="/denunciar" />}
              >
                <WarningCircleIcon aria-hidden="true" weight="fill" />
                {m.home_cta_report()}
              </Button>
              <Button
                size="touch-lg"
                variant="outline"
                className="border-stage-foreground/50 bg-transparent text-stage-foreground hover:bg-stage-foreground/10 hover:text-stage-foreground"
                render={<Link to="/coleta" />}
              >
                {m.home_cta_schedule()}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-card-elevated md:p-6 lg:p-8">
            {neighborhoodId === undefined && (
              <div
                className="flex flex-col gap-4"
                role="status"
                aria-label={m.common_loading()}
              >
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}
            {neighborhoodId !== undefined && (
              <NeighborhoodPicker
                neighborhoods={neighborhoods}
                value={neighborhoodId}
                onValueChange={choose}
              >
                <NeighborhoodPickerList />
                <NeighborhoodPickerClosed>
                  {hasSchedule && <NextCollection passes={passes} now={now} />}
                  {!hasSchedule && (
                    <Skeleton
                      role="status"
                      aria-label={m.common_loading()}
                      className="h-48 w-full"
                    />
                  )}
                </NeighborhoodPickerClosed>
                <NeighborhoodPickerSummary />
              </NeighborhoodPicker>
            )}
          </div>
        </div>
      </section>

      {/* The 14 days and the notices side by side from `lg`: the strip becomes a grid
          of two weeks and the notices sit beside it, so a wide screen shows both without
          scrolling. With no neighborhood chosen yet there is no strip and the notices
          take the whole row. */}
      <div
        data-has-schedule={Boolean(hasSchedule)}
        className="page-container grid grid-cols-[minmax(0,1fr)] gap-10 pt-10 lg:gap-14 lg:pt-14 lg:data-[has-schedule=true]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      >
        {hasSchedule && (
          <section className="flex flex-col gap-3 lg:gap-5">
            <h2 className="text-fluid-section font-extrabold tracking-tight">
              {m.home_next_days()}
            </h2>
            <WasteCalendar passes={passes} now={now}>
              <WasteCalendarStrip />
            </WasteCalendar>
          </section>
        )}

        <section className="flex flex-col gap-4 lg:gap-5">
          <h2 className="text-fluid-section font-extrabold tracking-tight">
            {m.home_notices()}
          </h2>
          <NoticeList notices={notices}>
            <NoticeListItems
              limit={2}
              className={cn({ 'md:grid md:grid-cols-2': !hasSchedule })}
            />
            <NoticeListEmpty />
          </NoticeList>
          <Button
            variant="ghost"
            size="touch"
            className="self-start"
            render={<Link to="/avisos" />}
          >
            {m.home_all_notices()}
          </Button>
        </section>
      </div>

      <section className="page-container pt-10 lg:pt-14">
        <div className="stage-band flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center md:justify-between md:gap-10 md:p-8 lg:p-12">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-fluid-section font-extrabold tracking-tight text-balance">
              {m.home_report_title()}
            </h2>
            <p className="text-lg text-stage-muted lg:text-xl">
              {m.home_report_text()}
            </p>
          </div>
          <Button
            size="touch-lg"
            variant="secondary"
            className={STAGE_CTA}
            render={<Link to="/denunciar" />}
          >
            <WarningCircleIcon aria-hidden="true" weight="fill" />
            {m.home_cta_report()}
          </Button>
        </div>
      </section>

      <section className="page-container flex flex-col gap-5 py-10 lg:gap-6 lg:py-14">
        <h2 className="text-fluid-section font-extrabold tracking-tight">
          {m.home_how_title()}
        </h2>
        {/* A divided list on a phone, three cards in a row from `md`. */}
        <ol className="flex flex-col divide-y md:grid md:grid-cols-3 md:gap-5 md:divide-y-0">
          {[
            {
              icon: ListChecksIcon,
              title: m.home_how_1_title(),
              text: m.home_how_1_text(),
            },
            {
              icon: CameraIcon,
              title: m.home_how_2_title(),
              text: m.home_how_2_text(),
            },
            {
              icon: MapPinIcon,
              title: m.home_how_3_title(),
              text: m.home_how_3_text(),
            },
          ].map((item) => (
            <li
              key={item.title}
              className="flex gap-4 py-4 first:pt-0 last:pb-0 md:flex-col md:rounded-2xl md:bg-card md:p-5 md:shadow-card md:first:pt-5 md:last:pb-5"
            >
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"
              >
                <item.icon className="size-6" weight="fill" />
              </span>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-base text-muted-foreground">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside
          aria-labelledby="emergency-title"
          className="flex gap-4 rounded-2xl bg-badge-alert p-4 text-badge-alert-foreground md:p-6"
        >
          <PhoneCallIcon
            aria-hidden="true"
            weight="fill"
            className="mt-1 size-7 shrink-0"
          />
          <div className="flex flex-col gap-1">
            <h3 id="emergency-title" className="text-lg font-bold">
              {m.home_emergency_title()}
            </h3>
            <p className="text-base">{m.home_emergency_text()}</p>
          </div>
        </aside>
      </section>
    </>
  )
}
