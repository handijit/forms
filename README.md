# @handijit/forms

[![npm](https://img.shields.io/npm/v/@handijit/forms)](https://www.npmjs.com/package/@handijit/forms)
[![downloads](https://img.shields.io/npm/dm/@handijit/forms)](https://www.npmjs.com/package/@handijit/forms)
[![license](https://img.shields.io/npm/l/@handijit/forms)](./LICENSE)

Zod-based client forms for React, for Han Dijit's Electron desktop programs and, later, the site
and the panel. Writing a form is a schema, the fields and `onSubmit`; validation, error display,
focus management, submit state and server field errors then behave the same, and accessibly, in
every program. A headless core works with any markup; ready binders render the field components
of [`@handijit/ui`](https://www.npmjs.com/package/@handijit/ui) 2.

- **No runtime dependency.** `react` and `zod` are peers; `@handijit/ui` and `@handijit/tr` are
  optional peers, used only by their own entry points.
- **Small.** 12.1 kB gzip for the core as shipped (unminified, with comments); the ui binders add
  4.9 kB and the Turkish formatters 1.7 kB, only when imported.
- **Typed from the schema.** Field values are `z.input`, `onSubmit` receives `z.output`; field
  names are checked dotted paths (`"items.0.price"`), so `transform` and `coerce` schemas work.
- **Renders only what changes.** Each field subscribes to its own slice of the store through
  `useSyncExternalStore`; typing in one field does not render the form or the other fields.
- **Accessible by default.** Stable ids, `aria-invalid`, `aria-describedby` (error and hint),
  `noValidate`, Enter submits, focus moves to the first invalid field (scrolled to the middle of
  the view), an error summary with links, checked with axe.
- **Tested on React 18 and 19**, in StrictMode, in jsdom and in a real Chromium in both themes:
  241 tests (107 in Node, 67 on each React), 100% line, branch, function and statement coverage.
- **ES modules and CommonJS**, with types for both, `"use client"` on the client entries, and
  safe to import during server rendering.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Quick start](#quick-start)
- [When to use it](#when-to-use-it)
- [How a form behaves](#how-a-form-behaves)
- [API reference](#api-reference)
- [Guides](#guides)
- [Server rendering](#server-rendering)
- [Bundle size](#bundle-size)
- [TypeScript](#typescript)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Releasing](#releasing)
- [License](#license)

## Requirements

| Peer           | Range    | Needed for                                |
| -------------- | -------- | ----------------------------------------- |
| `react`        | `>=18`   | everything                                |
| `zod`          | `^4.0.0` | everything (classic `zod` and `zod/mini`) |
| `@handijit/ui` | `^2.0.0` | `@handijit/forms/ui` only (optional)      |
| `@handijit/tr` | `^1.0.0` | `@handijit/forms/tr` only (optional)      |

The build targets ES2022: Electron 43+, and evergreen browsers for the site and the panel. The
tooling needs Node 24 or later.

## Installation

```sh
npm install @handijit/forms zod
# with the ui binders and the Turkish formatters:
npm install @handijit/ui @handijit/tr
```

`yarn add` and `pnpm add` take the same package names.

## Quick start

```tsx
import { z } from "zod";
import { Form, useForm } from "@handijit/forms";
import {
  CheckboxField,
  ErrorSummary,
  SubmitButton,
  TextField,
} from "@handijit/forms/ui";

const schema = z.object({
  name: z.string().min(2, "Adınızı yazın"),
  email: z.email("Geçerli bir e-posta adresi yazın"),
  terms: z.literal(true, { error: "Koşulları kabul edin" }),
});

export const SignUp = () => {
  const form = useForm({
    schema,
    defaultValues: { name: "", email: "" },
    onSubmit: async (values, { applyServerErrors }) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (!response.ok) applyServerErrors(await response.json());
    },
  });
  return (
    <Form form={form}>
      <ErrorSummary />
      <TextField name="name" label="Ad soyad" />
      <TextField name="email" label="E-posta" type="email" />
      <CheckboxField name="terms" label="Kullanım koşullarını kabul ediyorum" />
      <SubmitButton>Hesap oluştur</SubmitButton>
    </Form>
  );
};
```

The fields read the form from `<Form>`. Required marks come from the schema; the required
mark's screen-reader text and ui's other texts come from ui's `<UiProvider labels>`, as in every
ui app.

## When to use it

Use it for the forms of a React client: settings dialogs, records in a desktop program, sign-up
and checkout on the site. It does not do server actions, multi-step wizards with persisted
drafts, or form builders driven by JSON; those belong to the application.

## How a form behaves

| Moment                                  | `mode: "submit"` (default)   | `mode: "blur"`                  | `mode: "change"`               |
| --------------------------------------- | ---------------------------- | ------------------------------- | ------------------------------ |
| Typing before the first submit          | silent                       | silent until the field was left | the changed field shows errors |
| Leaving a field before the first submit | marks it touched             | shows that field's errors       | shows that field's errors      |
| Submit                                  | every error shows            | every error shows               | every error shows              |
| Typing after a submit                   | errors update on each change | errors update on each change    | errors update on each change   |

- **Cross-field rules** (`refine`, `superRefine`) land on the path they name; a rule without a
  path is a form-level error.
- **A failed submit** focuses the first invalid field on screen, in document order, scrolled to
  the middle of the view (no animation under `prefers-reduced-motion`). When no field on screen
  has the error, the error summary takes the focus.
- **A successful submit** makes the submitted values the new baseline: `isDirty` turns false,
  unless `onSubmit` chose another baseline with `reset`.
- **A second submit** while one runs is ignored; `isSubmitting` stays true until `onSubmit`
  settles.
- **Server and manual errors** stay until their field changes or the next submit. Errors for
  fields that are not on screen become form-level errors.
- **An error of a nested path** (`period.end`) shows on a field bound to its parent
  (`period`) as well.

## API reference

### `@handijit/forms`

#### `useForm(options): FormApi<z.input<Schema>>`

| Option          | Type                                             | Default    | Description                                                       |
| --------------- | ------------------------------------------------ | ---------- | ----------------------------------------------------------------- |
| `schema`        | Zod 4 schema with an object input                | (required) | Read from the latest render.                                      |
| `defaultValues` | `DeepPartial<z.input<Schema>>`                   | (required) | Read once; load new values with `reset(values)`.                  |
| `onSubmit`      | `(values: z.output<Schema>, helpers) => unknown` | (required) | A returned promise keeps the form submitting.                     |
| `onInvalid`     | `(errors, formErrors) => void`                   |            | After a submit that failed validation.                            |
| `onSubmitError` | `(error, helpers) => void`                       |            | When `onSubmit` throws; without it the form shows `submitFailed`. |
| `mode`          | `"submit" \| "blur" \| "change"`                 | `"submit"` | When errors appear before the first submit.                       |
| `messages`      | `Partial<FormMessages>`                          | Turkish    | `submitFailed`, `serverFieldError`; see `DEFAULT_MESSAGES`.       |

`helpers` is `{ applyServerErrors, setError, setFormError, reset }`. The returned form is stable
for the component's life, and the component that calls `useForm` does not render again while
the user types.

#### `FormApi<Values>`

| Member                                                                   | Description                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `getState()`, `getValues()`, `getValue(name)`                            | The current snapshot (not reactive; see the hooks).                             |
| `getFieldState(name)`                                                    | `{ value, error, isTouched, isDirty, isValidating, isRequired }`.               |
| `setValue(name, value, { shouldTouch?, shouldValidate? })`               | Typed by path.                                                                  |
| `blur(name)`                                                             | What leaving a field does.                                                      |
| `setError(name, message)`, `setFormError(message)`, `clearErrors(name?)` | Manual errors.                                                                  |
| `applyServerErrors(errors)`                                              | See [server errors](#server-errors).                                            |
| `reset(values?)`                                                         | Back to the defaults (or to `values`, which become the defaults).               |
| `validate()`                                                             | Checks everything and shows every error; resolves to whether the form is valid. |
| `handleSubmit(event?)`                                                   | The `onSubmit` handler of a `<form>`.                                           |
| `focusFirstError()`, `focusField(name)`                                  | Focus helpers; `false` when nothing could take the focus.                       |
| `array(name)`, `getArrayKeys(name)`                                      | Array operations and row keys (see `useFieldArray`).                            |
| `subscribe(listener)`                                                    | For your own `useSyncExternalStore`.                                            |

`FormState` holds `values`, `defaultValues`, `errors` (visible field errors by path),
`formErrors`, `touched`, `isDirty`, `isSubmitting`, `isValidating`, `isSubmitSuccessful` and
`submitCount`.

#### Hooks

| Hook                                                         | Returns                                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `useField(form, name, { validate?, label?, id?, hasHint? })` | Field state, `setValue`, `onBlur`, `id`, `errorId`, `hintId`, `controlProps` (aria) and `inputProps` (for a native input). |
| `useFieldArray(form, name)`                                  | `rows` (`{ key, index, name }`), `error` of the array, `append`, `prepend`, `insert`, `remove`, `move`, `swap`, `replace`. |
| `useWatch(form, name)`                                       | The live value at `name`; renders only when that branch changes.                                                           |
| `useFormState(form, selector?, isEqual?)`                    | A slice of `FormState`, compared shallowly by default.                                                                     |
| `useFieldFormat(field, format)`                              | `{ value, onChange, onBlur }` for an input that shows formatted text.                                                      |
| `useUnsavedChanges(form, { blockUnload? })`                  | `true` while there are unsubmitted changes; `blockUnload` asks the browser to confirm leaving.                             |
| `useErrorSummary(form)`                                      | `{ isVisible, formErrors, items, ref }` for your own summary.                                                              |
| `useFormContext()`                                           | The form of the nearest `<Form>`; throws outside one.                                                                      |
| `useRegisterField(form, name, registration)`                 | Tells the form where a hand-made control is, for focus and the summary.                                                    |

#### `<Form form isDisabled? isReadOnly? …formProps>`

A `<form noValidate>` that submits through the form and provides it to the fields inside.
`isDisabled` and `isReadOnly` reach every bound field.

#### `numberFormat({ decimals?, allowNegative? })`

A `FieldFormat<number | undefined>` for Turkish numbers (`1.234.567,89`): grouping while typing,
`undefined` for empty input, `NaN` for text it cannot read, so the schema decides.

#### `FieldFormat<Value>`

```ts
type FieldFormat<Value> = {
  format(value: Value): string; // value → text (on blur and on outside changes)
  parse(text: string): Value; // text → value (on every keystroke)
  mask?(text: string): string; // reshapes the text while typing; the caret keeps its place
};
```

### `@handijit/forms/ui`

Every binder takes `name`, `label`, `hint`, `isRequired` (default: from the schema),
`requiredLabel`, `isLabelHidden`, `className` (on ui's `Field`), an optional `form` (default: the
nearest `<Form>`) and an optional `validate`, plus the props of the ui component it renders.

| Binder                | ui component             | Value                                             |
| --------------------- | ------------------------ | ------------------------------------------------- |
| `TextField`           | `Input` (+ `format`)     | `string` (or the format's)                        |
| `NumberField`         | `Input` + `numberFormat` | `number \| undefined`                             |
| `TextareaField`       | `Textarea`               | `string`                                          |
| `PasswordField`       | `PasswordInput`          | `string`                                          |
| `SelectField`         | `Select`                 | `string`                                          |
| `ComboboxField`       | `Combobox`               | `string \| null`                                  |
| `CheckboxField`       | `Checkbox`               | `boolean`                                         |
| `SwitchField`         | `Switch`                 | `boolean`                                         |
| `RadioGroupField`     | `Radio` × n              | `string`                                          |
| `RadioCardGroupField` | `RadioCard` × n          | `string`                                          |
| `DateField`           | `DateField`              | ISO `string`                                      |
| `DateRangeField`      | `DateRange`              | `{ start, end }`                                  |
| `QuantityField`       | `QuantityStepper`        | `number`                                          |
| `SegmentedField`      | `SegmentedControl`       | `string`                                          |
| `ChipGroupField`      | `ChipGroup`              | `string \| null`, or `string[]` with `isMultiple` |
| `RangeSliderField`    | `RangeSlider`            | `[number, number]`                                |
| `RatingField`         | `RatingInput`            | `number \| null`                                  |
| `TagInputField`       | `TagInput`               | `string[]`                                        |
| `FileUploadField`     | `FileUpload`             | `File[]`                                          |

- `SubmitButton`: ui's `Button` with `type="submit"`, busy while submitting. Default text
  "Kaydet".
- `ErrorSummary`: ui's danger `Alert` listing every error after a failed submit, with links to
  the fields. Default title "Lütfen işaretli alanları düzeltin.".
- `fieldsOf(form)`: the binders typed for one form (see [TypeScript](#typescript)).

The binders add no styles: the look, the dark theme and the focus ring are ui's.

### `@handijit/forms/tr`

`FieldFormat`s on `@handijit/tr`, for `TextField`'s `format` or `useFieldFormat`:

| Format        | Typed as           | Value                                 |
| ------------- | ------------------ | ------------------------------------- |
| `moneyFormat` | `3.490,00`         | kuruş (`349000`); empty `undefined`   |
| `phoneFormat` | `0532 123 45 67`   | E.164 (`+905321234567`) once complete |
| `ibanFormat`  | `TR33 0006 1005 …` | compact upper case (`TR330006…`)      |
| `dateFormat`  | `31.12.2026`       | ISO date (`2026-12-31`)               |
| `tcknFormat`  | 11 digits          | the digits                            |
| `vknFormat`   | 10 digits          | the digits                            |

Validity stays in the schema: `z.string().refine(isValidPhone)` with `isValidPhone`,
`isValidIban`, `isValidTckn` and `isValidVkn` from `@handijit/tr`.

## Guides

### Server errors

`applyServerErrors` takes what the Han Dijit backend sends, an RFC 9457 problem whose `fields`
lists the rejected request fields, or a plain map of messages:

```ts
// 400 from the backend: every listed field is marked with `detail`.
form.applyServerErrors({
  status: 400,
  code: "VALIDATION_ERROR",
  detail: "Girilen bilgiler geçersiz.",
  fields: ["email", "items[0].title"],
});
// A message per field.
form.applyServerErrors({
  email: "Bu e-posta kayıtlı",
  "": "Kayıt bu arada değişti.",
});
```

`items[0].title` and `/items/0/title` become `items.0.title`. A field that is not on screen,
and a problem without `fields`, become form-level errors. The first marked field takes the
focus.

### Arrays

```tsx
const Items = () => {
  const form = useFormContext<Values>();
  const { rows, error, append, remove } = useFieldArray(form, "items");
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {rows.map((row) => (
        <div key={row.key}>
          <TextField
            name={`${row.name}.title`}
            label={`Satır ${row.index + 1}`}
          />
          <button type="button" onClick={() => remove(row.index)}>
            Sil
          </button>
        </div>
      ))}
      <button type="button" onClick={() => append({ title: "" })}>
        Satır ekle
      </button>
    </>
  );
};
```

Touched state and errors move with their rows; keys follow the items through moves and
removals, so inputs keep their focus and text.

### A check the schema cannot do

```tsx
<TextField
  name="email"
  label="E-posta"
  validate={async (email, { signal }) => {
    const response = await fetch(`/api/emails/${email}`, { signal });
    return response.ok ? "Bu e-posta kayıtlı" : undefined;
  }}
/>
```

A field validator runs on blur (once errors are visible) and on submit, only after the schema
accepted the field. A change aborts the running check and drops its result; only the newest
result is applied.

### Unsaved changes in an Electron window

```ts
// Reactive, for a "kaydedilmedi" mark in the title bar:
const hasUnsavedChanges = useUnsavedChanges(form);
// Synchronous, inside the app's own close flow:
const canClose = !form.getState().isDirty;
```

`{ blockUnload: true }` uses `beforeunload`, which a browser turns into its own dialog; in
Electron a blocked unload keeps the window open silently unless main handles
`will-prevent-unload`.

### Headless markup

```tsx
const Email = () => {
  const form = useFormContext<Values>();
  const field = useField(form, "email", { label: "E-posta", hasHint: true });
  return (
    <div>
      <label htmlFor={field.id}>E-posta</label>
      <input type="email" {...field.inputProps} />
      <p id={field.hintId}>İş adresiniz</p>
      {field.error && (
        <p id={field.errorId} role="alert">
          {field.error}
        </p>
      )}
    </div>
  );
};
```

## Server rendering

The core and ui entries start with `"use client"`, so React Server Components bundlers treat
them as client modules; the tr entry is plain functions. Nothing touches `window` or `document`
during render: the tarball smoke test renders forms with `react-dom/server`, with and without
ui.

## Bundle size

Measured on the shipped files by `npm run size` (unminified, comments kept; a minifier takes
roughly half off):

| File              | Raw     | Gzip    | Budget  |
| ----------------- | ------- | ------- | ------- |
| `build/index.mjs` | 44.2 kB | 12.1 kB | 13.0 kB |
| `build/ui.mjs`    | 24.9 kB | 4.9 kB  | 6.0 kB  |
| `build/tr.mjs`    | 4.2 kB  | 1.7 kB  | 2.0 kB  |

| Entry                | ESM               | CommonJS          | Types                         |
| -------------------- | ----------------- | ----------------- | ----------------------------- |
| `@handijit/forms`    | `build/index.mjs` | `build/index.cjs` | `build/index.d.mts` / `.d.ts` |
| `@handijit/forms/ui` | `build/ui.mjs`    | `build/ui.cjs`    | `build/ui.d.mts` / `.d.ts`    |
| `@handijit/forms/tr` | `build/tr.mjs`    | `build/tr.cjs`    | `build/tr.d.mts` / `.d.ts`    |

The ui and tr entries import the core by its package name, so an app loads one copy of it
whichever entries it uses. `sideEffects` is `false`; ui components are imported by their
subpaths (`@handijit/ui/input`), so an unused binder costs nothing.

## TypeScript

- Paths are dotted strings with numeric array indexes; a key that contains a dot is not
  supported. Paths stop at dates, files, blobs and functions, and after eight levels.
- `FieldPath<T>`, `FieldPathValue<T, P>`, `FieldArrayPath<T>` and `FieldPathByValue<T, V>` are
  exported. A `z.coerce` field's input is `unknown`, so any binder accepts it.
- A binder's `name` is checked when the form's type is known: pass `form`, write
  `<TextField<Values> …>`, or take the binders from `fieldsOf(form)`:

  ```tsx
  const f = fieldsOf(form);
  <f.TextField name="address.city" label="Şehir" />; // a typo does not compile
  ```

  `fieldsOf` references every binder, so a bundler keeps them all; import the binders one by
  one where size matters.

- `CheckboxField` and `SwitchField` accept boolean paths only, `TagInputField` `string[]`,
  `FileUploadField` `File[]`, `DateRangeField` `{ start, end }`, `RangeSliderField` number pairs.

## FAQ

**Why is the form not re-rendering while I type?** On purpose. Read state reactively with
`useFormState(form, (state) => state.isDirty)` or `useWatch`.

**Why did my async refinement run twice?** The first check tries a synchronous parse; Zod calls
the refinement, then reports that the schema is async, and the form switches to async parsing
for good. It happens once per form.

**Can I change `defaultValues` later?** Call `reset(values)`; they become the new baseline.

**Where do the Turkish texts come from?** Zod messages come from your schema. The package's own
texts (`submitFailed`, `serverFieldError`, the summary title, the submit button) are Turkish by
default and overridable. ui's texts come from ui's `UiProvider`.

## Contributing

```sh
npm install
npm run verify        # lint, typecheck, tests with coverage, build, size, package lint, tarball smoke
npm run test:browser  # the sample form in Chromium (PLAYWRIGHT_SKIP_BROWSER_GC=1 npx playwright install chromium)
```

The tests run in three Vitest projects: Node, and jsdom on React 19 and on React 18 (installed
in the private `react18/` workspace). Coverage must stay at 100%.

## Releasing

1. Add the version's section to `CHANGELOG.md`.
2. Bump `version` in `package.json`.
3. Push to `master`. The publish workflow runs the browser test and every gate, publishes with
   provenance, tags `v<version>` and creates the GitHub Release from the changelog section. A
   push without a version bump publishes nothing.

## License

[MIT](./LICENSE)
