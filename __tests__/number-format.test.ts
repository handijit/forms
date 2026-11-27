import { describe, expect, test } from "vitest";

import numberFormat from "../lib/modules/number-format";

describe("numberFormat", () => {
  test("should group whole numbers while typing and drop everything else", () => {
    const { mask } = numberFormat();
    expect(mask?.("1234567")).toBe("1.234.567");
    expect(mask?.("00012a3")).toBe("123");
    expect(mask?.("12,5")).toBe("12");
    expect(mask?.("-5")).toBe("5");
    expect(mask?.("")).toBe("");
  });

  test("should keep a decimal comma and at most `decimals` digits after it", () => {
    const { mask } = numberFormat({ decimals: 2, allowNegative: true });
    expect(mask?.("1234,567")).toBe("1.234,56");
    expect(mask?.("1234,")).toBe("1.234,");
    expect(mask?.("1,2,3")).toBe("1,23");
    expect(mask?.(" -0,5")).toBe("-0,5");
    expect(mask?.("-")).toBe("-");
  });

  test("should parse Turkish text, empty input being undefined and garbage NaN", () => {
    const { parse } = numberFormat({ decimals: 2, allowNegative: true });
    expect(parse("1.234,56")).toBe(1234.56);
    expect(parse("-5")).toBe(-5);
    expect(parse("")).toBeUndefined();
    expect(parse("  ")).toBeUndefined();
    expect(parse("-")).toBeUndefined();
    expect(parse("1,2,3")).toBeNaN();
  });

  test("should format numbers, trimming trailing fraction zeros", () => {
    const { format } = numberFormat({ decimals: 2 });
    expect(format(1234.5)).toBe("1.234,5");
    expect(format(1234)).toBe("1.234");
    expect(format(-1234.567)).toBe("-1.234,57");
    expect(format(0)).toBe("0");
    expect(format(undefined)).toBe("");
    expect(format(Number.NaN)).toBe("");
    expect(format(Number.POSITIVE_INFINITY)).toBe("");
    expect(numberFormat().format(1234.4)).toBe("1.234");
  });

  test("should fall back to whole numbers for decimals it cannot use", () => {
    for (const decimals of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const format = numberFormat({ decimals });
      expect(format.format(12.34)).toBe("12");
      expect(format.mask?.("12,34")).toBe("12");
    }
    expect(numberFormat({ decimals: 2.9 }).format(1.239)).toBe("1,24");
    expect(numberFormat({ decimals: 500 }).format(0.5)).toBe("0,5");
  });
});
