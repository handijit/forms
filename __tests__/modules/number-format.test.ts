import { describe, expect, test } from "vitest";

import numberFormat from "../../lib/modules/number-format";

describe("numberFormat", () => {
  test("should group whole numbers while typing and drop everything else", () => {
    const { mask, parse, format } = numberFormat();
    expect(mask?.("1234567")).toBe("1.234.567");
    expect(mask?.("00012a")).toBe("12");
    expect(mask?.("12,5")).toBe("12");
    expect(mask?.("-5")).toBe("5");
    expect(parse("1.234.567")).toBe(1234567);
    expect(format(1234567)).toBe("1.234.567");
  });

  test("should take a decimal comma up to the allowed digits", () => {
    const { mask, parse, format } = numberFormat({ decimals: 2 });
    expect(mask?.("1234,567")).toBe("1.234,56");
    expect(mask?.("12,")).toBe("12,");
    expect(mask?.("1,2,3")).toBe("1,23");
    expect(parse("1.234,5")).toBe(1234.5);
    expect(format(1234.5)).toBe("1.234,5");
    expect(format(12)).toBe("12");
  });

  test("should accept a leading minus when allowed", () => {
    const { mask, parse, format } = numberFormat({ allowNegative: true });
    expect(mask?.(" -12")).toBe("-12");
    expect(parse("-")).toBeUndefined();
    expect(parse("-1.000")).toBe(-1000);
    expect(format(-1000)).toBe("-1.000");
  });

  test("should read empty text as undefined and show non-numbers as empty", () => {
    const { parse, format } = numberFormat();
    expect(parse("  ")).toBeUndefined();
    expect(format(undefined)).toBe("");
    expect(format(Number.NaN)).toBe("");
    expect(format(null as never)).toBe("");
  });
});
