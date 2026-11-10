import { normalizePhone } from "@handijit/tr";
import type { FieldFormat } from "@handijit/forms";

import { digitsOf, groupDigits } from "./digits.helper";

const PHONE_GROUPS = [4, 3, 2, 2];

/**
 * A Turkish phone number, shown as `0532 123 45 67`. The value is E.164 (`+905321234567`) once
 * the number is complete; until then it is the typed text, which an `isValidPhone` refinement
 * rejects. Empty is `""`.
 */
const phoneFormat: FieldFormat<string> = {
  // Groups what was typed without adding digits of its own, so the caret keeps its place:
  // `0532 123 45 67`, `532 123 45 67` or `+90 532 123 45 67`.
  mask: (text) => {
    if (text.trimStart().startsWith("+")) {
      return `+${groupDigits(digitsOf(text, 12), [2, 3, 3, 2, 2], " ")}`;
    }
    const digits = digitsOf(text, 11);
    return digits.startsWith("0")
      ? groupDigits(digits, PHONE_GROUPS, " ")
      : groupDigits(digits.slice(0, 10), [3, 3, 2, 2], " ");
  },
  parse: (text) => normalizePhone(text) ?? text,
  format: (value) => {
    if (typeof value !== "string") return "";
    const normalized = normalizePhone(value);
    return normalized === null
      ? value
      : groupDigits(`0${normalized.slice(3)}`, PHONE_GROUPS, " ");
  },
};

export default phoneFormat;
