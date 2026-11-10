import type { FieldFormat } from "../types/format.type";

export type NumberFormatOptions = {
  /** Digits after the decimal comma; `0` (default) takes whole numbers only. */
  decimals?: number;
  /** Accepts a leading minus. */
  allowNegative?: boolean;
};

const group = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/**
 * Numbers the Turkish way: `1.234.567,89`. Grouping dots appear while typing; an empty input
 * is `undefined`, unreadable text `NaN`, so the schema decides what is missing or wrong.
 */
const numberFormat = ({
  decimals = 0,
  allowNegative = false,
}: NumberFormatOptions = {}): FieldFormat<number | undefined> => {
  const mask = (text: string): string => {
    const negative = allowNegative && text.trimStart().startsWith("-");
    const [whole = "", ...fractions] = text.split(",");
    const integer = group(whole.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
    const fraction = fractions.join("").replace(/\D/g, "").slice(0, decimals);
    const hasComma = decimals > 0 && fractions.length > 0;
    return `${negative ? "-" : ""}${integer}${hasComma ? `,${fraction}` : ""}`;
  };
  return {
    mask,
    parse: (text) => {
      const normalized = text.trim().replace(/\./g, "").replace(",", ".");
      if (normalized === "" || normalized === "-") return undefined;
      return Number(normalized);
    },
    format: (value) => {
      if (value === undefined || !Number.isFinite(value)) return "";
      const [whole = "", fraction] = Math.abs(value)
        .toFixed(decimals)
        .split(".");
      const trimmed = fraction?.replace(/0+$/, "") ?? "";
      return `${value < 0 ? "-" : ""}${group(whole)}${trimmed === "" ? "" : `,${trimmed}`}`;
    },
  };
};

export default numberFormat;
