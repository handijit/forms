import { formatMoney, parseMoney } from "@handijit/tr";
import type { FieldFormat } from "@handijit/forms";

/**
 * Turkish lira in kuruş: the value `349000` reads `3.490,00`. Put the currency in the input's
 * `suffix`. Empty is `undefined`; text `parseMoney` cannot read is `NaN`.
 */
const moneyFormat: FieldFormat<number | undefined> = {
  mask: (text) => text.replace(/[^\d.,-]/g, ""),
  parse: (text) => {
    if (text.trim() === "") return undefined;
    return parseMoney(text) ?? Number.NaN;
  },
  format: (value) =>
    value === undefined || value === null || !Number.isFinite(value)
      ? ""
      : formatMoney(value).replace(/\s*TL$/, ""),
};

export default moneyFormat;
