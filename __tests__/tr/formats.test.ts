import { describe, expect, test } from "vitest";

import {
  dateFormat,
  ibanFormat,
  moneyFormat,
  phoneFormat,
  tcknFormat,
  vknFormat,
} from "../../lib/tr";

describe("moneyFormat", () => {
  test("should show kuruş as lira without the currency", () => {
    expect(moneyFormat.format(349000)).toBe("3.490,00");
    expect(moneyFormat.format(undefined)).toBe("");
    expect(moneyFormat.format(Number.NaN)).toBe("");
    expect(moneyFormat.format(null as never)).toBe("");
  });

  test("should read typed lira as kuruş", () => {
    expect(moneyFormat.parse("3.490,00")).toBe(349000);
    expect(moneyFormat.parse("12,5")).toBe(1250);
    expect(moneyFormat.parse(" ")).toBeUndefined();
    expect(moneyFormat.parse("1,2,3")).toBeNaN();
    expect(moneyFormat.mask?.("₺12a,5")).toBe("12,5");
  });
});

describe("phoneFormat", () => {
  test("should group the digits while typing", () => {
    expect(phoneFormat.mask?.("05321234567")).toBe("0532 123 45 67");
    expect(phoneFormat.mask?.("5321234567890")).toBe("532 123 45 67");
    expect(phoneFormat.mask?.("+905321234567")).toBe("+90 532 123 45 67");
    expect(phoneFormat.mask?.(" +")).toBe("+");
    expect(phoneFormat.mask?.("abc")).toBe("");
  });

  test("should store E.164 once complete and the text until then", () => {
    expect(phoneFormat.parse("0532 123 45 67")).toBe("+905321234567");
    expect(phoneFormat.parse("0532")).toBe("0532");
    expect(phoneFormat.format("+905321234567")).toBe("0532 123 45 67");
    expect(phoneFormat.format("0532")).toBe("0532");
    expect(phoneFormat.format(undefined as never)).toBe("");
  });
});

describe("ibanFormat", () => {
  test("should group by four, upper-case and cut at 26 characters", () => {
    expect(ibanFormat.mask?.("tr330006100519786457841326999")).toBe(
      "TR33 0006 1005 1978 6457 8413 26"
    );
    expect(ibanFormat.parse("TR33 0006 1005 1978 6457 8413 26")).toBe(
      "TR330006100519786457841326"
    );
    expect(ibanFormat.parse("tr12 34")).toBe("TR1234");
    expect(ibanFormat.format("TR330006100519786457841326")).toBe(
      "TR33 0006 1005 1978 6457 8413 26"
    );
    expect(ibanFormat.format(undefined as never)).toBe("");
  });
});

describe("dateFormat", () => {
  test("should type dd.MM.yyyy for an ISO value", () => {
    expect(dateFormat.mask?.("31122026")).toBe("31.12.2026");
    expect(dateFormat.mask?.("3112")).toBe("31.12");
    expect(dateFormat.parse("31.12.2026")).toBe("2026-12-31");
    expect(dateFormat.parse("31.02.2026")).toBe("31.02.2026");
    expect(dateFormat.parse("")).toBe("");
    expect(dateFormat.format("2026-12-31")).toBe("31.12.2026");
    expect(dateFormat.format("31.12")).toBe("31.12");
    expect(dateFormat.format(undefined as never)).toBe("");
  });
});

describe("tcknFormat and vknFormat", () => {
  test("should keep digits only, up to the length of the number", () => {
    expect(tcknFormat.mask?.("1234567890123")).toBe("12345678901");
    expect(vknFormat.mask?.("12a34567890123")).toBe("1234567890");
    expect(tcknFormat.parse("123")).toBe("123");
    expect(tcknFormat.format("123")).toBe("123");
    expect(vknFormat.format(undefined as never)).toBe("");
  });
});
