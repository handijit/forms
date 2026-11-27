import type { FieldFormat } from "@handijitcom/forms";

// A Turkish IBAN: TR, two check digits and 22 more.
const IBAN_LENGTH = 26;

const group = (compact: string): string =>
  compact.replace(/(.{4})(?=.)/g, "$1 ");

/**
 * A Turkish IBAN, shown in groups of four (`TR33 0006 1005 …`). The value is the compact,
 * upper-case form (`TR330006…`); `isIban` from `@handijitcom/tr` checks it in the schema. Empty
 * is `""`.
 */
const ibanFormat: FieldFormat<string> = {
  mask: (text) =>
    group(
      text
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, IBAN_LENGTH)
    ),
  parse: (text) => text.replace(/\s/g, "").toUpperCase(),
  format: (value) => (typeof value === "string" ? group(value) : ""),
};

export default ibanFormat;
