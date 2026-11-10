import { parseDate } from "@handijit/tr";
import type { FieldFormat } from "@handijit/forms";

import { digitsOf, groupDigits } from "./digits.helper";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * A date typed the Turkish way (`31.12.2026`) for an ISO date value (`2026-12-31`). Dots appear
 * while typing; a date that does not exist stays the typed text, which `z.iso.date()` rejects.
 * Empty is `""`.
 */
const dateFormat: FieldFormat<string> = {
  mask: (text) => groupDigits(digitsOf(text, 8), [2, 2, 4], "."),
  parse: (text) => (text === "" ? "" : (parseDate(text) ?? text)),
  format: (value) => {
    if (typeof value !== "string") return "";
    const match = ISO_DATE.exec(value);
    return match === null ? value : `${match[3]}.${match[2]}.${match[1]}`;
  },
};

export default dateFormat;
