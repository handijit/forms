import { formatLira, parseLira } from "@handijitcom/tr";
import type { FieldFormat } from "@handijitcom/forms";

/**
 * Turkish lira in kuruş: the value `349000` reads `3.490,00`. Put the currency in the input's
 * `suffix`. Empty is `undefined`; text `parseLira` cannot read is `NaN`. A value that is not a
 * whole number of kuruş shows as empty text (money is never rounded here).
 */
const moneyFormat: FieldFormat<number | undefined> = {
  mask: (text) => text.replace(/[^\d.,-]/g, ""),
  parse: (text) => {
    if (text.trim() === "") return undefined;
    return parseLira(text) ?? Number.NaN;
  },
  format: (value) =>
    Number.isSafeInteger(value)
      ? formatLira(value as number, { symbol: false })
      : "",
};

export default moneyFormat;
