import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * What the `database/schema.ts` generator needs to know and cannot read from the
 * database.
 *
 * Today only one thing: which columns are **not** in the response. Lucid's default
 * is to serialize every column, and `database/schema.ts` is generated — declaring
 * `serializeAs: null` on the model does not survive the next generation. Here it survives.
 *
 * The cut is narrow on purpose: what is **equivalent to a credential** goes in, plus the
 * one datum that must never leave by accident, the reporter's `contact`. The panel reads
 * the contact through an explicit repository field list (`ReportRepository.detail`) and
 * the public reads select their own columns, so hiding it from model serialization costs
 * nothing and closes the day someone serializes a `Report` model on a public route.
 */
export default {
  tables: {
    reports: {
      columns: {
        // The reporter's contact is personal data that only the panel reads, through an
        // explicit field list. Hidden from serialization so a future `serialize()` of this
        // model on a public route cannot leak it by default.
        contact: {
          tsType: 'string | null',
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
    auth_access_tokens: {
      columns: {
        // The value that proves the session. No route serializes this model today, and
        // that is exactly why the protection needs to be here: whoever
        // adds a `preload` tomorrow will not remember.
        hash: {
          tsType: 'string',
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
  },
} satisfies SchemaRules
