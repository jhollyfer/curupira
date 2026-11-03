import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'
import { BASE_LOCALE, type Locale } from '@curupira/shared'
import type { FieldContext, Infer } from '@vinejs/vine/types'
import { ACTIVE_STATUSES, SORT_DIRECTIONS } from '@curupira/shared'

/**
 * The configured `vine` and what belongs to all validators (_standards/backend.md §4.4).
 *
 * Each resource has its own `app/features/<module>/<resource>/<resource>.validator.ts`,
 * and imports `vine` from here - never from `@vinejs/vine` directly: it is through this module
 * that the pt-BR messages and the date transform apply to every schema. Only the rules
 * used by two or more resources stay here (as functions, so one validator's
 * `optional()` does not leak into another), `LIST_LIMITS`, the global
 * validators and the messages.
 *
 * The OpenAPI generator resolves validators through the controllers' AST, reading the
 * import specifier and re-importing the module. Renaming an export without
 * updating the controller does not break the build: the operation silently vanishes from
 * the document, and `node ace openapi:generate --check` is what catches it.
 */

export { vine }
export type { Infer }
/** The VineJS errors, so `handler.ts` translates the 422 without importing the lib directly. */
export { errors as vineErrors } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

/**
 * Validated dates come out as Luxon `DateTime`, ready for Lucid - and not
 * as the native `Date`, which the model would have to convert in each use case.
 */
VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Rules reused by more than one resource.
 *
 * They are functions, not constants: reusing the same schema node in two
 * validators would share the options between them - one's `optional()`
 * would show up in the other.
 */

/**
 * How many items each list accepts, from `shared/`: the Zod validator and this one read
 * the same ceilings, so the two sides cannot drift apart.
 */
export { LIST_LIMITS } from '@curupira/shared'

/**
 * Explicit `null` refused on an `optional()` field that is not `nullable()`.
 *
 * VineJS 4's `optional()` treats `null` as absent and drops it from the payload, and the
 * bodyparser converts `""` into `null` (`convertEmptyStringsToNull`). Together, a
 * `title: ""` on an update became "leave alone" and answered 200 with the old value.
 * `implicit` because the rule must run precisely when the value is `null`.
 */
const notNullRule = vine.createRule(
  (value: unknown, _options: undefined, field: FieldContext) => {
    if (value === null) field.report('Informe {{ field }}', 'required', field)
  },
  { implicit: true },
)

export function notNull() {
  return notNullRule()
}

/** Date and time with offset: `2026-11-03T14:30:00-04:00` or `...T18:30:00.000Z`. */
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/

/**
 * ISO 8601 **with offset**, and not `vine.date({ formats: ['iso8601'] })`.
 *
 * VineJS's `iso8601` falls to a loose `dayjs(value)` when the strict format fails, and
 * accepts any text JavaScript's `Date` understands: `03/11/2026 14:30` became March 11th,
 * and `2026-11-03` without offset, midnight UTC. Hence the text is checked here, and the
 * use case converts it (`Instant`) respecting the received offset.
 */
const isoDateTimeRule = vine.createRule(
  (value: unknown, _options: undefined, field) => {
    if (typeof value !== 'string') return
    if (ISO_DATE_TIME.test(value) && DateTime.fromISO(value).isValid) return

    // The phrase lives in the catalog below (key `isoDateTime`), in the three languages.
    field.report('Informe {{ field }}', 'isoDateTime', field)
  },
)

/** An instant: ISO 8601 with offset, kept as a string (the use case parses it). */
export function isoInstant() {
  return vine
    .string()
    .trim()
    .maxLength(40)
    .use(isoDateTimeRule())
    .meta({ format: 'date-time' })
}

export function email() {
  return vine.string().email().maxLength(254)
}

/**
 * Password strength: one `regex` per character class, so the message points at
 * exactly what is missing instead of a "weak password" that does not say what to do.
 *
 * `confirmed` requires `passwordConfirmation` with the same value, read from the raw
 * input. No schema here declares it, and that is the only reason it does not show up in the
 * validated payload - there is nothing to discard before `merge()`/`create()` in the
 * use case. What VineJS delivers is what the schema declares.
 */
export function password() {
  return vine
    .string()
    .minLength(8)
    .maxLength(32)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/)
    .confirmed({ as: 'passwordConfirmation' })
}

/**
 * Account status. Canonical in English: the value is an identifier, and the
 * Portuguese label belongs to the frontend.
 */
export function activeStatus() {
  return vine.enum(ACTIVE_STATUSES)
}

/**
 * The three fields every listing accepts. Spread
 * (`...paginationFields()`) by the validators that still add a filter
 * of their own, so the `perPage` ceiling lives in one place - repeated by hand in
 * each resource, it is a divergence waiting to happen.
 */
/** Page and size, for a listing that does not search (_standards/backend.md §4.4). */
export function pageFields() {
  return {
    page: vine.number().min(1).optional(),
    perPage: vine.number().min(1).max(100).optional(),
  }
}

/** Page, size and `search` - only for whoever actually reads `payload.search`. */
export function paginationFields() {
  return {
    ...pageFields(),
    search: vine.string().maxLength(100).optional(),
  }
}

/**
 * The order of a listing, in two fields: `sort` (the column) and `direction`.
 *
 * **A pair, and not one `order-<column>` per column.** Two order parameters at the
 * same time do not express precedence - `?order-title=asc&order-date=desc`
 * does not say which wins -, and the query sorts by a single column.
 *
 * **The column comes from a closed list, declared per resource.** The value goes
 * straight into `orderBy`, which composes it into the SQL: accepting free text from the URL would be
 * handing the clause to the client. A column outside the list is a 422 pointing at the field,
 * and not a database 500 complaining about a nonexistent column.
 *
 * Outside `paginationFields()` on purpose: each
 * resource sorts by what it has, and a global set would promise in OpenAPI
 * columns that half the listings do not know.
 */
export function sortFields<
  const TColumns extends readonly [string, ...string[]],
>(columns: TColumns) {
  return {
    sort: vine.enum(columns).optional(),
    direction: vine.enum(SORT_DIRECTIONS).optional(),
  }
}

/**
 * The identifier in the URL. Holds for every resource: the PK is a uuid in every table.
 *
 * It exists so a malformed `:id` is a 422 pointing at the field, and not a Postgres
 * 500 refusing the literal in the `where` clause.
 */
export const IdentifierValidator = vine.create({
  id: vine.string().uuid(),
})

export const PageValidator = vine.create(vine.object(pageFields()))

export const PaginationValidator = vine.create(vine.object(paginationFields()))

export type IdentifierPayload = Infer<typeof IdentifierValidator>

export type PagePayload = Infer<typeof PageValidator>
export type PaginationPayload = Infer<typeof PaginationValidator>

/*
|--------------------------------------------------------------------------
| Validation messages
|--------------------------------------------------------------------------
|
| Without this VineJS answers in its English default, and the 422 comes out bilingual: the
| envelope of `app/exceptions/handler.ts` is localized ("Dados inválidos") and the
| `errors` values would come out in English, because the handler copies the message
| verbatim. Every business error of the use cases is already localized - only the
| validation error, which is the most frequent, would stand out.
|
| Two traps, if you change this:
|
| - `FIELD_LABELS` swaps only the **displayed** `{{ field }}`. The error key stays
|   the field name (`avatarId`), and it is what the frontend uses to mark
|   the right input. Renaming a key breaks the form.
| - Do not configure `vine.errorReporter`. The handler depends on the array format
|   `{ field, rule, message }` of the `SimpleErrorReporter`.
|
*/

/**
 * The friendly name of each field, in the form that reads well after "Informe".
 *
 * It is exported, and not written straight into the call below, because
 * `app/core/validator.spec.ts` needs to import it by name - without
 * depending on the order of the `SimpleMessagesProvider` arguments. That same
 * test enforces a label for every validator field and flags orphan labels, so a
 * new field in `#core/validator` is born red until it enters here.
 */
const PT_BR_FIELD_LABELS = {
  // Identity and account
  name: 'o nome',
  email: 'o e-mail',
  password: 'a senha',
  passwordConfirmation: 'a confirmação da senha',
  currentPassword: 'a senha atual',
  role: 'o papel',
  status: 'o status',
  avatarId: 'o avatar',
  id: 'o identificador',

  // Neighborhood and schedule
  latitude: 'a latitude',
  longitude: 'a longitude',
  neighborhoodId: 'o bairro',
  wasteType: 'o tipo de resíduo',
  weekday: 'o dia da semana',
  shift: 'o turno',
  note: 'a observação',

  // Report
  kind: 'o tipo da denúncia',
  description: 'a descrição',
  contact: 'o contato',
  photoIds: 'as fotos',
  message: 'a resposta',
  from: 'a data inicial',
  to: 'a data final',
  protocol: 'o protocolo',

  // Notice
  title: 'o título',
  body: 'o texto',
  startsAt: 'o início',
  endsAt: 'o fim',

  // File. These do not go through a panel form.
  fileName: 'o nome do arquivo',
  mimetype: 'o tipo do arquivo',
  size: 'o tamanho',
  parts: 'as partes',
  partNumber: 'o número da parte',
  etag: 'o ETag',

  // Listing
  page: 'a página',
  perPage: 'o total por página',
  search: 'a busca',
  sort: 'a ordenação',
  direction: 'a direção da ordenação',
}

/** The keys of `PT_BR_FIELD_LABELS`: the compiler enforces the same list in the other languages. */
type FieldLabels = Record<keyof typeof PT_BR_FIELD_LABELS, string>

/**
 * The friendly name of each field, per language, in the form that reads well after
 * "Informe" (pt-BR), "Ingresa" (es) and "Enter" (en) - `_standards/i18n.md` §3.
 *
 * It is exported because `app/core/validator.unit.spec.ts` enforces a label for every
 * validator field and flags orphan labels, so a new field is born red
 * until it enters here, in the three languages.
 */
export const FIELD_LABELS = {
  'pt-BR': PT_BR_FIELD_LABELS,
  es: {
    // Identity and account
    name: 'el nombre',
    email: 'el correo electrónico',
    password: 'la contraseña',
    passwordConfirmation: 'la confirmación de la contraseña',
    currentPassword: 'la contraseña actual',
    role: 'el rol',
    status: 'el estado',
    avatarId: 'el avatar',
    id: 'el identificador',

    // Neighborhood and schedule
    latitude: 'la latitud',
    longitude: 'la longitud',
    neighborhoodId: 'el barrio',
    wasteType: 'el tipo de residuo',
    weekday: 'el día de la semana',
    shift: 'el turno',
    note: 'la observación',

    // Report
    kind: 'el tipo de denuncia',
    description: 'la descripción',
    contact: 'el contacto',
    photoIds: 'las fotos',
    message: 'la respuesta',
    from: 'la fecha inicial',
    to: 'la fecha final',
    protocol: 'el protocolo',

    // Notice
    title: 'el título',
    body: 'el texto',
    startsAt: 'el inicio',
    endsAt: 'el fin',

    // File
    fileName: 'el nombre del archivo',
    mimetype: 'el tipo de archivo',
    size: 'el tamaño',
    parts: 'las partes',
    partNumber: 'el número de la parte',
    etag: 'el ETag',

    // Listing
    page: 'la página',
    perPage: 'el total por página',
    search: 'la búsqueda',
    sort: 'el orden',
    direction: 'la dirección del orden',
  },
  en: {
    // Identity and account
    name: 'the name',
    email: 'the email',
    password: 'the password',
    passwordConfirmation: 'the password confirmation',
    currentPassword: 'the current password',
    role: 'the role',
    status: 'the status',
    avatarId: 'the avatar',
    id: 'the identifier',

    // Neighborhood and schedule
    latitude: 'the latitude',
    longitude: 'the longitude',
    neighborhoodId: 'the neighborhood',
    wasteType: 'the waste type',
    weekday: 'the weekday',
    shift: 'the shift',
    note: 'the note',

    // Report
    kind: 'the report type',
    description: 'the description',
    contact: 'the contact',
    photoIds: 'the photos',
    message: 'the reply',
    from: 'the start date',
    to: 'the end date',
    protocol: 'the protocol',

    // Notice
    title: 'the title',
    body: 'the text',
    startsAt: 'the start',
    endsAt: 'the end',

    // File
    fileName: 'the file name',
    mimetype: 'the file type',
    size: 'the size',
    parts: 'the parts',
    partNumber: 'the part number',
    etag: 'the ETag',

    // Listing
    page: 'the page',
    perPage: 'the page size',
    search: 'the search',
    sort: 'the sort order',
    direction: 'the sort direction',
  },
} satisfies Record<Locale, FieldLabels>

const PT_BR_RULE_MESSAGES = {
  // Generic
  // `{{ field }}` only appears where the phrase starts with a verb. The labels
  // carry an article ("o resumo"), so a field at the start of the phrase would come out
  // in lower case, and `'em {{ field }}'` would come out as "em a senha". In the other
  // rules the name is omitted: the error is rendered under the labeled field, and in the
  // API it comes indexed by its name.
  required: 'Informe {{ field }}',
  string: 'Informe {{ field }}',
  enum: 'Selecione {{ field }}',
  email: 'Informe um e-mail válido',
  number: 'Informe um número válido',
  boolean: 'Informe verdadeiro ou falso',
  array: 'Informe uma lista',
  object: 'Informe um objeto',
  uuid: 'Selecione uma opção válida',
  url: 'Informe um link válido',
  minLength: 'Informe ao menos {{ min }} caracteres',
  maxLength: 'Informe no máximo {{ max }} caracteres',
  min: 'Informe um valor maior ou igual a {{ min }}',
  max: 'Informe um valor menor ou igual a {{ max }}',
  positive: 'Informe um valor maior que zero',
  withoutDecimals: 'Informe um número inteiro',
  'array.maxLength': 'Informe no máximo {{ max }} itens',
  isoDateTime: 'Informe data e hora em ISO 8601 com fuso',

  // Password
  // The four `.regex()` of `password()` all report the key
  // `password.regex`, and VineJS stops at the first that fails - there is no way to give
  // a message per character class. Hence the combined message.
  'password.regex':
    'A senha precisa de letra minúscula, maiúscula, número e caractere especial',
  'password.minLength': 'A senha deve ter ao menos {{ min }} caracteres',
  'password.maxLength': 'A senha deve ter no máximo {{ max }} caracteres',
  // `confirmed` runs on `password` but reports on `passwordConfirmation`.
  'passwordConfirmation.confirmed': 'As senhas não são iguais',
}

type RuleMessages = Record<keyof typeof PT_BR_RULE_MESSAGES, string>

/**
 * The phrase of each validation rule, per language. Exported for the same reason
 * as `FIELD_LABELS`: the meta-spec enforces that every rule used by the validators
 * has a translation in the three languages.
 */
export const RULE_MESSAGES = {
  'pt-BR': PT_BR_RULE_MESSAGES,
  es: {
    required: 'Ingresa {{ field }}',
    string: 'Ingresa {{ field }}',
    enum: 'Selecciona {{ field }}',
    email: 'Ingresa un correo electrónico válido',
    number: 'Ingresa un número válido',
    boolean: 'Indica verdadero o falso',
    array: 'Ingresa una lista',
    object: 'Ingresa un objeto',
    uuid: 'Selecciona una opción válida',
    url: 'Ingresa un enlace válido',
    minLength: 'Ingresa al menos {{ min }} caracteres',
    maxLength: 'Ingresa como máximo {{ max }} caracteres',
    min: 'Ingresa un valor mayor o igual a {{ min }}',
    max: 'Ingresa un valor menor o igual a {{ max }}',
    positive: 'Ingresa un valor mayor que cero',
    withoutDecimals: 'Ingresa un número entero',
    'array.maxLength': 'Ingresa como máximo {{ max }} elementos',
    isoDateTime: 'Ingresa fecha y hora en ISO 8601 con zona horaria',
    'password.regex':
      'La contraseña necesita minúscula, mayúscula, número y carácter especial',
    'password.minLength':
      'La contraseña debe tener al menos {{ min }} caracteres',
    'password.maxLength':
      'La contraseña debe tener como máximo {{ max }} caracteres',
    'passwordConfirmation.confirmed': 'Las contraseñas no coinciden',
  },
  en: {
    required: 'Enter {{ field }}',
    string: 'Enter {{ field }}',
    enum: 'Select {{ field }}',
    email: 'Enter a valid email',
    number: 'Enter a valid number',
    boolean: 'Enter true or false',
    array: 'Enter a list',
    object: 'Enter an object',
    uuid: 'Select a valid option',
    url: 'Enter a valid link',
    minLength: 'Enter at least {{ min }} characters',
    maxLength: 'Enter at most {{ max }} characters',
    min: 'Enter a value greater than or equal to {{ min }}',
    max: 'Enter a value less than or equal to {{ max }}',
    positive: 'Enter a value greater than zero',
    withoutDecimals: 'Enter a whole number',
    'array.maxLength': 'Enter at most {{ max }} items',
    isoDateTime: 'Enter date and time in ISO 8601 with time zone',
    'password.regex':
      'The password needs a lowercase letter, an uppercase letter, a number and a special character',
    'password.minLength':
      'The password must have at least {{ min }} characters',
    'password.maxLength': 'The password must have at most {{ max }} characters',
    'passwordConfirmation.confirmed': 'The passwords do not match',
  },
} satisfies Record<Locale, RuleMessages>

/**
 * One messages provider per language. The language middleware picks the request's
 * (`detect-user-locale.middleware.ts`); outside a request the base
 * language applies (_doc-lib/vinejs.md#custom_error_messages).
 */
export const VALIDATION_MESSAGES = {
  'pt-BR': new SimpleMessagesProvider(
    RULE_MESSAGES['pt-BR'],
    FIELD_LABELS['pt-BR'],
  ),
  es: new SimpleMessagesProvider(RULE_MESSAGES.es, FIELD_LABELS.es),
  en: new SimpleMessagesProvider(RULE_MESSAGES.en, FIELD_LABELS.en),
} satisfies Record<Locale, SimpleMessagesProvider>

vine.messagesProvider = VALIDATION_MESSAGES[BASE_LOCALE]
