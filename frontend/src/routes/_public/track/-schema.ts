import { StorefrontReportShowByProtocolValidator } from '@curupira/shared'
import type { z } from '@curupira/shared'

/**
 * The tracking form is the shared lookup validator as is: it trims, normalizes the
 * look-alike letters (`O`→`0`, `I`/`L`→`1`) and checks the `CUR-XXXX-XXXX` shape, the
 * same rule the backend applies. The form holds the typed text (`input`); the submit
 * reads the normalized code (`output`).
 */
export const TrackFormValidator = StorefrontReportShowByProtocolValidator

export type TrackFormInput = z.input<typeof TrackFormValidator>
export type TrackFormOutput = z.output<typeof TrackFormValidator>
