import { FunnelSimpleIcon, XIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { useIsMobile } from '#/hooks/use-mobile'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

type FilterPanelProps = Readonly<{
  /** The form's accessible name ("Filtrar as ocorrências"). */
  label: string
  /** How many filters are in force (`countActiveFilters`). */
  activeCount: number
  /** Clears every filter; the button only exists while there is one to clear. */
  onClear?: () => void
  children: React.ReactNode
}>

/**
 * The filter row of a listing. From `md` it is the inline row of controls every listing
 * had. On a phone the same controls fold into a bottom sheet behind one "Filtros (n)"
 * button: five stacked fields would push the first result below the fold, and the count
 * keeps the list honest - it says there *is* a cut even while the controls are hidden.
 *
 * The controls are rendered once, in whichever container fits: they write to the URL on
 * change, so there is no draft state to lose when the window crosses the breakpoint, and
 * the sheet has nothing to "apply" - it only closes.
 */
export function FilterPanel({
  label,
  activeCount,
  onClear,
  children,
}: FilterPanelProps): React.JSX.Element {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const titleId = React.useId()
  let buttonLabel = m.panel_filters_button()
  if (activeCount > 0)
    buttonLabel = m.panel_filters_button_count({ count: activeCount })

  const form = (
    <form
      role="search"
      aria-label={label}
      className={cn('flex shrink-0 flex-wrap items-end gap-3', {
        'flex-col items-stretch px-4': isMobile,
      })}
      onSubmit={(event) => event.preventDefault()}
    >
      {children}
      {activeCount > 0 && onClear && (
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="h-9 max-md:justify-start"
        >
          <XIcon aria-hidden="true" data-icon="inline-start" />
          {m.panel_filters_clear()}
        </Button>
      )}
    </form>
  )

  if (!isMobile) return form

  return (
    <React.Fragment>
      <Button
        type="button"
        variant="outline"
        className="shrink-0 justify-start"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <FunnelSimpleIcon aria-hidden="true" data-icon="inline-start" />
        {buttonLabel}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          aria-labelledby={titleId}
          className="panel-touch max-h-[88svh] overflow-y-auto rounded-t-xl pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle id={titleId}>{m.panel_filters_title()}</SheetTitle>
            <SheetDescription>{m.panel_filters_description()}</SheetDescription>
          </SheetHeader>
          {form}
          <SheetFooter>
            <Button type="button" onClick={() => setOpen(false)}>
              {m.panel_filters_show_results()}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </React.Fragment>
  )
}
