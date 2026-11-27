import { parseDateTr } from "@handijitcom/tr";
import type { FieldFormat } from "@handijitcom/forms";

import { digitsOf, groupDigits } from "./digits.helper";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TR_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/**
 * A date typed the Turkish way (`31.12.2026`) for an ISO date value (`2026-12-31`). Dots appear
 * while typing; a date that does not exist (`31.04.2026`) stays the typed text, which
 * `z.iso.date()` rejects. Empty is `""`.
 */
const dateFormat: FieldFormat<string> = {
  mask: (text) => groupDigits(digitsOf(text, 8), [2, 2, 4], "."),
  parse: (text) => {
    const match = TR_DATE.exec(text.trim());
    // `parseDateTr` knows the calendar: it rejects the days a month does not have.
    if (match === null || parseDateTr(text) === undefined) return text;
    const [, day = "", month = "", year = ""] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  },
  format: (value) => {
    if (typeof value !== "string") return "";
    const match = ISO_DATE.exec(value);
    return match === null ? value : `${match[3]}.${match[2]}.${match[1]}`;
  },
};

export default dateFormat;
