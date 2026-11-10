# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-11-10

Moves to `@handijit/ui` 2.2, which closes the gaps the 1.0 binders worked around: the controls now
carry their own errors, links and read-only state.

### Changed

- **Requires `@handijit/ui` `^2.2.0`** for `@handijit/forms/ui` (was `^2.0.0`).
- **`<Form isReadOnly>` makes the composites read-only instead of disabled**: `SelectField`,
  `ComboboxField`, `QuantityField`, `SegmentedField`, `ChipGroupField`, `RangeSliderField`,
  `RatingField`, `DateRangeField` and `TagInputField` stay focusable and readable
  (`aria-readonly` / native `readOnly`). Checkboxes, switches, radios and file uploads are still
  disabled: ui has no read-only state for them.
- **`SelectField` and `ComboboxField` are touched when focus leaves them**, through ui's new
  `onBlur`, not when a choice is made. A field validator runs on that blur.
- **`CheckboxField` and `SwitchField` render the control alone**: ui's `Checkbox` / `Switch` draw
  the error under their label (ui 2.2 `error`). The ui `Field` around them, with an empty hidden
  label, is gone; `className` lands on the control's root (its `<label>`), not on a wrapper.
- **The control takes the field's id** (`useField`'s `id`), so the ids are the form's in every
  binder; ui's `Field` gets it through its new `id` prop.

### Added

- `SegmentedField` and `ChipGroupField` follow `<Form isDisabled>` and take their own
  `isDisabled` / `isReadOnly` (ui 2.2's group-wide states; in 1.0 a disabled form left them
  enabled).
- A `ReactNode` `label` with `summaryLabel` on `TextField`, `NumberField`, `TextareaField`,
  `PasswordField`, `DateField` and `ComboboxField` (ui 2.2 `Field` takes a rich label).
- `NamedBinderProps` and `NamedFieldFrameProps`: the props of a binder whose control is named by
  the label text.

### Fixed

- **The composites link their error to the control a screen reader stops at.** In 1.0 the error
  and hint ids sat on a wrapper `<div>` (or nowhere) because ui's composites took no `id` /
  `aria-*`; now the number box, the slider thumbs, the date fields, the radio groups and the
  rating's fieldset carry `aria-invalid` and `aria-describedby` themselves.
- **A checkbox's or switch's hint is linked once.** 1.0 passed the hint id next to the error id
  to work around ui replacing the hint; ui 2.2 merges the links.
- **The `nodenext` smoke test checks ui's declarations** (`skipLibCheck` off): ui 2.2 resolves
  under Node's own resolution, ES modules and CommonJS.

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
