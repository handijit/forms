import type { FieldFormat } from "@handijit/forms";

import digitsFormat from "./digits-format";

/** A vergi kimlik numarası: 10 digits. Check it with `isValidVkn` from `@handijit/tr`. */
const vknFormat: FieldFormat<string> = /*#__PURE__*/ digitsFormat(10);

export default vknFormat;
