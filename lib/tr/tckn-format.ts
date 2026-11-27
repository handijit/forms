import type { FieldFormat } from "@handijitcom/forms";

import digitsFormat from "./digits-format";

/** A T.C. kimlik numarası: 11 digits. Check it with `isTckn` from `@handijitcom/tr`. */
const tcknFormat: FieldFormat<string> = /*#__PURE__*/ digitsFormat(11);

export default tcknFormat;
