import type { FieldFormat } from "@handijitcom/forms";

import digitsFormat from "./digits-format";

/** A vergi kimlik numarası: 10 digits. Check it with `isVkn` from `@handijitcom/tr`. */
const vknFormat: FieldFormat<string> = /*#__PURE__*/ digitsFormat(10);

export default vknFormat;
