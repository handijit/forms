/**
 * Two-way formatting between a field's value and the text in its input.
 * - `format` turns the value into display text (on blur and when the value changes from outside).
 * - `parse` turns the typed text into the value (on every keystroke). Text it cannot read should
 *   come back as something the schema rejects, so the error is the schema's.
 * - `mask`, optional, reshapes the text while the user types (grouping digits, dropping letters);
 *   the caret keeps its place among the significant characters.
 */
export type FieldFormat<TValue> = {
  format(value: TValue): string;
  parse(text: string): TValue;
  mask?(text: string): string;
};

/** Any `FieldFormat`, whatever its value type: what a text binder accepts. */
export type AnyFieldFormat = {
  format(value: never): string;
  parse(text: string): unknown;
  mask?(text: string): string;
};
