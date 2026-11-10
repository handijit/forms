# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-10

First release: Zod-based client forms for React, in three entry points (`.`, `./ui`, `./tr`), as
ES modules and CommonJS.

### Added

- `useForm`: a form typed from a Zod 4 schema (`z.input` values, `z.output` on submit), stable
  for the component's life, reading the latest schema and callbacks.
- Validation timing by `mode` (`submit`, `blur`, `change`), cross-field issues on their paths,
  synchronous parsing where possible and async schemas with only the latest run applied.
- An async-safe submit: double submits ignored, `isSubmitting`, `isSubmitSuccessful`, the
  submitted values as the new baseline, a Turkish default message when `onSubmit` throws.
- `applyServerErrors` for RFC 9457 problems (`fields` as a list or a map, `items[0].name`
  paths) and plain message maps; errors for fields not on screen become form-level errors.
- `setValue`, `setError`, `setFormError`, `clearErrors`, `reset`, `validate`, touched and dirty
  state, focus on the first invalid field in document order, scrolled to the middle of the view.
- Hooks: `useField` (per-field subscription and aria attributes), `useFieldArray` (stable row
  keys; row state moves with the row), `useWatch`, `useFormState`, `useFieldFormat` (format,
  parse and mask with a stable caret), `useUnsavedChanges`, `useErrorSummary`,
  `useFormContext`, `useRegisterField`; field validators with abort and stale-result protection.
- `<Form>`: a `noValidate` form that submits on Enter and passes disabled and read-only states
  to its fields; `numberFormat` for Turkish numbers; `DEFAULT_MESSAGES`.
- `@handijit/forms/ui`: binders for the `@handijit/ui` 2 field components (`TextField`,
  `NumberField`, `TextareaField`, `PasswordField`, `SelectField`, `ComboboxField`,
  `CheckboxField`, `SwitchField`, `RadioGroupField`, `RadioCardGroupField`, `DateField`,
  `DateRangeField`, `QuantityField`, `SegmentedField`, `ChipGroupField`, `RangeSliderField`,
  `RatingField`, `TagInputField`, `FileUploadField`), `SubmitButton`, `ErrorSummary` and
  `fieldsOf`.
- `@handijit/forms/tr`: `moneyFormat`, `phoneFormat`, `ibanFormat`, `dateFormat`, `tcknFormat`
  and `vknFormat` on `@handijit/tr`.
