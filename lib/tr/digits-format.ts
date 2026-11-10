import type { FieldFormat } from "@handijit/forms";

import { digitsOf } from "./digits.helper";

/** Digits only, at most `length` of them: the shape of a TCKN (11) or a VKN (10). */
const digitsFormat = (length: number): FieldFormat<string> => ({
  mask: (text) => digitsOf(text, length),
  parse: (text) => text,
  format: (value) => (typeof value === "string" ? value : ""),
});

export default digitsFormat;
