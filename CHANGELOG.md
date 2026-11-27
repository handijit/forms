# Changelog

All notable changes to this package are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the package follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-27

First release under the `@handijitcom` scope: `@handijit/forms` 1.1.0 (deprecated with the old
scope) ported to `@handijitcom/ui` 3 and `@handijitcom/tr` 1. The API is the same apart from the
changes below; [the README's migration table](./README.md#migrating-from-handijitforms) lists
them line by line.

### Changed

- **Renamed** to `@handijitcom/forms`; the entries are `@handijitcom/forms`,
  `@handijitcom/forms/ui` and `@handijitcom/forms/tr`.
- **Peers:** `@handijitcom/ui` `^3.0.0` (was `@handijit/ui` `^2.2.0`) and `@handijitcom/tr`
  `^1.0.0` (was `@handijit/tr` `^1.0.0`), both optional; `react` `>=18` and `zod` `^4.0.0` as
  before.
- **`@handijitcom/forms/tr`** reads `@handijitcom/tr`: `moneyFormat` uses `parseLira` /
  `formatLira`, `phoneFormat` uses `normalizePhone` / `formatPhone`, `dateFormat` checks the day
  with `parseDateTr`. The values are the same as in 1.1.0 (kuruş, E.164, ISO date).
- `FileUploadField`'s wrapper carries the field's id, so the error summary links to the upload.

### Added

- `MoneyField`, `PercentField`, `RateField` and `QuantityInputField`: ui 3's scaled-integer
  fields (`MoneyInput`, `PercentInput`, `RateInput`, `QuantityInput`) bound to a number field; an
  empty field is `null`. They are in `fieldsOf` too.
- `TR_MESSAGES` (and the `TrMessages` type) in `@handijitcom/forms/tr`: Turkish error texts for
  the schema's refinements next to `isTckn`, `isVkn`, `isIban`, `isMobilePhone` and
  `normalizePhone` of `@handijitcom/tr`.
- `NamedBinderProps`, `NamedFieldFrameProps` and `NumberPath` are exported from
  `@handijitcom/forms/ui`.

### Fixed

- **The CommonJS build of `@handijitcom/forms/ui` rendered ui's module objects instead of its
  components** ("Element type is invalid"): ui's CommonJS files are transpiled ES modules, and the
  build now reads their default export (`interop: "auto"`). `npm run verify` renders every binder
  from both formats to keep it so.
- **Leaving a field no longer erases text its format cannot read.** `useFieldFormat` tidies the
  text on blur only when the format can show the value it parsed: `1.23` in a money field stays
  as typed next to the schema's error instead of turning into an empty box.
- **Removing an index that is not a row** (`-1`, `5` on two rows, `0.5`) no longer shifts the
  touched state, errors and keys of the rows after it.
- **A `NaN` index** in `insert` or `move` counts as `0`; it used to leave every row's key and state
  on the wrong item.
- **A server error keyed `__proto__`** becomes a form-level error instead of vanishing.
- **A field validator that throws or rejects** still does not block the form, but its error is now
  rethrown (asynchronously) where the application's error reporting sees it, instead of being
  swallowed.
- **`numberFormat` with a negative or `NaN` `decimals`** falls back to whole numbers instead of
  throwing from `format` during render; `decimals` is capped at 20.
- **`moneyFormat.format` of an amount that is not whole kuruş** shows empty text instead of
  throwing (`@handijitcom/tr` refuses to round money).
- **`phoneFormat.format` of a half-typed number** no longer throws: `@handijitcom/tr`'s
  `normalizePhone` returns `undefined`, not `null`, for an incomplete number.

### Removed

- The Playwright browser test and the `test:browser` script: packages carry unit tests only; the
  binders are checked in jsdom with Testing Library and axe on React 19 and React 18.

[Unreleased]: https://github.com/handijit/forms/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/handijit/forms/releases/tag/v1.0.0
