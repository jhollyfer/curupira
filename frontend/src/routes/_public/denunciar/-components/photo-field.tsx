import { LIST_LIMITS } from '@curupira/shared'
import { CameraIcon, ImagesIcon, XIcon } from '@phosphor-icons/react'
import * as React from 'react'

import { buttonVariants } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/cn'
import { downscaleImage } from '#/lib/image'
import { m } from '#/paraglide/messages'

type PhotoFieldProps = Readonly<{
  value: ReadonlyArray<Blob>
  onChange: (photos: Array<Blob>) => void
  invalid: boolean
  describedBy?: string
}>

/**
 * One thumbnail. Read as a data URL by `FileReader`: unlike an object URL it needs no
 * revoking (nothing leaks when the field leaves), and the state is set from the
 * reader's callback, not synchronously in the effect.
 */
function PhotoPreview({
  blob,
  number,
  onRemove,
}: Readonly<{
  blob: Blob
  number: number
  onRemove: () => void
}>): React.JSX.Element {
  const [url, setUrl] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    let alive = true
    const reader = new FileReader()
    reader.onload = () => {
      if (alive && typeof reader.result === 'string') setUrl(reader.result)
    }
    reader.readAsDataURL(blob)

    return () => {
      alive = false
    }
  }, [blob])

  return (
    <li className="relative aspect-square overflow-hidden rounded-xl bg-muted">
      {url && (
        <img
          src={url}
          alt={m.report_photo_alt({ number })}
          width={240}
          height={240}
          className="size-full object-cover"
        />
      )}
      <button
        type="button"
        aria-label={m.report_photo_remove({ number })}
        onClick={onRemove}
        className="absolute top-1 right-1 grid size-11 place-items-center rounded-full bg-foreground/80 text-background outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <XIcon aria-hidden="true" weight="bold" className="size-5" />
      </button>
    </li>
  )
}

const PICK_BUTTON = cn(
  buttonVariants({ variant: 'outline', size: 'touch' }),
  'relative flex-1 cursor-pointer has-focus-visible:ring-4 has-focus-visible:ring-ring/60 has-disabled:pointer-events-none has-disabled:opacity-50',
)

/**
 * The photo of the occurrence: take one with the camera (`capture="environment"`, the
 * back camera) or pick from the gallery. Each photo is shrunk and stripped of its EXIF
 * (see `lib/image.ts`) before it is kept. The inputs are real, focusable file inputs
 * inside labels styled as buttons, so keyboard and screen reader work as for any file
 * field - and no JavaScript click is needed to open the picker.
 */
export function PhotoField({
  value,
  onChange,
  invalid,
  describedBy,
}: PhotoFieldProps): React.JSX.Element {
  const [processing, setProcessing] = React.useState(false)
  const full = value.length >= LIST_LIMITS.REPORT_PHOTOS

  async function add(
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const files = Array.from(event.target.files ?? [])
    // Allows choosing the same file again after removing it.
    event.target.value = ''
    if (files.length === 0) return

    setProcessing(true)
    const shrunk = await Promise.all(files.map(downscaleImage))
    setProcessing(false)

    onChange([...value, ...shrunk].slice(0, LIST_LIMITS.REPORT_PHOTOS))
  }

  return (
    <div className="flex flex-col gap-3" aria-describedby={describedBy}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className={PICK_BUTTON}>
          <CameraIcon aria-hidden="true" />
          {m.report_photo_camera()}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={full || processing}
            aria-invalid={invalid}
            onChange={(event) => {
              void add(event)
            }}
            className="sr-only"
          />
        </label>
        <label className={PICK_BUTTON}>
          <ImagesIcon aria-hidden="true" />
          {m.report_photo_gallery()}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={full || processing}
            aria-invalid={invalid}
            onChange={(event) => {
              void add(event)
            }}
            className="sr-only"
          />
        </label>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {processing && (
          <span className="inline-flex items-center gap-2">
            <Spinner className="size-4" />
            {m.report_photo_processing()}
          </span>
        )}
        {!processing &&
          m.report_photo_count({
            count: value.length,
            max: LIST_LIMITS.REPORT_PHOTOS,
          })}
      </p>

      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {value.map((blob, index) => (
            <PhotoPreview
              // The blob has no id and photos are only appended or removed, so the
              // position plus the size is stable between renders.
              key={`${index}-${blob.size}`}
              blob={blob}
              number={index + 1}
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
