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
import { NoticeList, NoticeListEmpty, NoticeListItems } from '#/components/common/notice-list'
import { WasteCalendar, WasteCalendarStrip } from '#/components/common/waste-calendar'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { useResidentNeighborhood } from '#/hooks/use-resident-neighborhood'
import {
  storefrontNeighborhoodsQueryOptions,
  storefrontNoticesQueryOptions,
  storefrontSchedulesQueryOptions,
} from '#/integrations/tanstack-query/queries/storefront'
import { m } from '#/paraglide/messages'

import { NextCollection } from './next-collection'

const route = getRouteApi('/_public/')

/** The page's content column: the same width on every section. */
const CONTAINER = 'mx-auto w-full max-w-6xl px-4'

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
        <div className={`${CONTAINER} grid gap-8 py-10 md:grid-cols-2 md:items-center md:py-16`}>
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">
              {m.home_title()}
            </h1>
            <p className="max-w-prose text-lg text-pretty text-stage-muted">
              {m.home_subtitle()}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="touch-lg"
                variant="secondary"
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

          <div className="rounded-3xl bg-card p-5 text-card-foreground shadow-card-elevated md:p-6">
            {neighborhoodId === undefined && (
              <div className="flex flex-col gap-4" role="status" aria-label={m.common_loading()}>
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

      {hasSchedule && (
        <section className={`${CONTAINER} flex flex-col gap-3 pt-8`}>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {m.home_next_days()}
          </h2>
          <WasteCalendar passes={passes} now={now}>
            <WasteCalendarStrip />
          </WasteCalendar>
        </section>
      )}

      <section className={`${CONTAINER} flex flex-col gap-4 pt-10`}>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {m.home_notices()}
        </h2>
        <NoticeList notices={notices}>
          <NoticeListItems limit={2} />
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

      <section className={`${CONTAINER} pt-10`}>
        <div className="stage-band flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex max-w-xl flex-col gap-2">
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-balance">
              {m.home_report_title()}
            </h2>
            <p className="text-lg text-stage-muted">{m.home_report_text()}</p>
          </div>
          <Button
            size="touch-lg"
            variant="secondary"
            render={<Link to="/denunciar" />}
          >
            <WarningCircleIcon aria-hidden="true" weight="fill" />
            {m.home_cta_report()}
          </Button>
        </div>
      </section>

      <section className={`${CONTAINER} flex flex-col gap-5 py-10`}>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {m.home_how_title()}
        </h2>
        <ol className="flex max-w-2xl flex-col divide-y">
          {[
            { icon: ListChecksIcon, title: m.home_how_1_title(), text: m.home_how_1_text() },
            { icon: CameraIcon, title: m.home_how_2_title(), text: m.home_how_2_text() },
            { icon: MapPinIcon, title: m.home_how_3_title(), text: m.home_how_3_text() },
          ].map((item) => (
            <li key={item.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
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
          className="flex max-w-2xl gap-4 rounded-2xl bg-badge-alert p-4 text-badge-alert-foreground"
        >
          <PhoneCallIcon aria-hidden="true" weight="fill" className="mt-1 size-7 shrink-0" />
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
