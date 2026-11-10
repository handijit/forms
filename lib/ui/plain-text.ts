import type { FieldFormat } from "@handijit/forms";

/** A value as text: `null` and `undefined` are empty, the typed text is the value. */
const PLAIN_TEXT: FieldFormat<unknown> = {
  format: (value) =>
    value === undefined || value === null ? "" : String(value),
  parse: (text) => text,
};

export default PLAIN_TEXT;
