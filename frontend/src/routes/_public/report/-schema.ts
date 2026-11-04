import {
  LIST_LIMITS,
  StorefrontReportCreateValidator,
  requiredIssue,
  z,
} from '@curupira/shared'

/**
 * The form's schema: the shared create validator, adapted to what exists before the
 * send. Two things differ from the contract and both are deliberate:
 *
 * - `photoIds` is gone and `photos` (the files themselves) takes its place: the ids only
 *   exist after the upload, which the send does. The same limits apply.
 * - `anonymous` is a form-only switch. When it is on, the contact is never sent; when
 *   it is off, the contact is required (a reply needs somewhere to go).
 */
export const ReportFormValidator = StorefrontReportCreateValidator.omit({
  photoIds: true,
})
  .extend({
    photos: z.array(z.instanceof(Blob)).min(1).max(LIST_LIMITS.REPORT_PHOTOS),
    anonymous: z.boolean(),
    // The contract's `contact` has `min(3)`, which an untouched (empty) field would
    // fail even when anonymous: here only the ceiling is enforced, and the `refine`
    // below demands the content when it matters.
    contact: z.string().trim().max(120).optional(),
  })
  .refine(
    (value) => value.anonymous || (value.contact?.trim().length ?? 0) >= 3,
    requiredIssue(['contact']),
  )

export type ReportFormValues = z.infer<typeof ReportFormValidator>
