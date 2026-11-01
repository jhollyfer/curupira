/**
 * A form dialog on a phone is a bottom sheet: anchored to the lower edge, full width,
 * square at the bottom, scrolling inside itself when the keyboard or a landscape screen
 * leaves it short. Centered at the middle of a 360px screen it floated with 16px of dead
 * margin per side and the on-screen keyboard covered the field being typed in.
 *
 * Passed as `className` to `DialogContent` (shadcn, not edited by hand): `cn` resolves the
 * conflicts with the primitive's own centering. `panel-touch` raises its controls to 44px.
 * From `sm` the dialog is the centered card it always was.
 */
export const PHONE_SHEET_CLASSES =
  'panel-touch max-h-[92svh] overflow-y-auto max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(1rem,env(safe-area-inset-bottom))]'
