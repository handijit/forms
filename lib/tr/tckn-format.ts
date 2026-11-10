import type { FieldFormat } from "@handijit/forms";

import digitsFormat from "./digits-format";

/** A T.C. kimlik numarası: 11 digits. Check it with `isValidTckn` from `@handijit/tr`. */
const tcknFormat: FieldFormat<string> = /*#__PURE__*/ digitsFormat(11);

export default tcknFormat;
