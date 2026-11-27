import { isIban, isMobilePhone, isTckn, isVkn } from "@handijitcom/tr";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { digitsOf, groupDigits } from "../lib/tr/digits.helper";
import {
  dateFormat,
  ibanFormat,
  moneyFormat,
  phoneFormat,
  tcknFormat,
  TR_MESSAGES,
  vknFormat,
} from "../lib/tr";

describe("digits helper", () => {
  test("should keep digits up to a limit and group them", () => {
    expect(digitsOf("a1b2c3", 2)).toBe("12");
    expect(groupDigits("05321234567", [4, 3, 2, 2], " ")).toBe(
      "0532 123 45 67"
    );
    expect(groupDigits("0532", [4, 3, 2, 2], " ")).toBe("0532");
    expect(groupDigits("", [2], ".")).toBe("");
  });
});

describe("dateFormat", () => {
  test("should put the dots in while typing", () => {
    expect(dateFormat.mask?.("31122026")).toBe("31.12.2026");
    expect(dateFormat.mask?.("3112")).toBe("31.12");
    expect(dateFormat.mask?.("31.12.20261")).toBe("31.12.2026");
  });

  test("should parse a real day to its ISO date and keep anything else as typed", () => {
    expect(dateFormat.parse("31.12.2026")).toBe("2026-12-31");
    expect(dateFormat.parse("1.2.2026")).toBe("2026-02-01");
    expect(dateFormat.parse("29.02.2024")).toBe("2024-02-29");
    expect(dateFormat.parse("29.02.2026")).toBe("29.02.2026");
    expect(dateFormat.parse("31.12")).toBe("31.12");
    expect(dateFormat.parse("")).toBe("");
  });

  test("should format an ISO date the Turkish way and leave other text alone", () => {
    expect(dateFormat.format("2026-12-31")).toBe("31.12.2026");
    expect(dateFormat.format("31.12")).toBe("31.12");
    expect(dateFormat.format(undefined as unknown as string)).toBe("");
  });
});

describe("ibanFormat", () => {
  const IBAN = "TR330006100519786457841326";

  test("should group by four in upper case and stop at 26 characters", () => {
    expect(ibanFormat.mask?.("tr33 0006-1005 1978 6457 8413 2699")).toBe(
      "TR33 0006 1005 1978 6457 8413 26"
    );
  });

  test("should parse to the compact form and format it back", () => {
    expect(ibanFormat.parse("TR33 0006 1005 1978 6457 8413 26")).toBe(IBAN);
    expect(ibanFormat.parse("tr33 00")).toBe("TR3300");
    expect(ibanFormat.format(IBAN)).toBe("TR33 0006 1005 1978 6457 8413 26");
    expect(ibanFormat.format(null as unknown as string)).toBe("");
    expect(isIban(ibanFormat.parse("TR33 0006 1005 1978 6457 8413 26"))).toBe(
      true
    );
  });
});

describe("moneyFormat", () => {
  test("should keep only what an amount is written with while typing", () => {
    expect(moneyFormat.mask?.("₺1.234,50 TL")).toBe("1.234,50");
  });

  test("should parse to kuruş, empty input being undefined and garbage NaN", () => {
    expect(moneyFormat.parse("3.490,00")).toBe(349000);
    expect(moneyFormat.parse("12,5")).toBe(1250);
    expect(moneyFormat.parse("  ")).toBeUndefined();
    expect(moneyFormat.parse("1.23")).toBeNaN();
  });

  test("should format whole kuruş without a sign and never round money", () => {
    expect(moneyFormat.format(349000)).toBe("3.490,00");
    expect(moneyFormat.format(-5)).toBe("-0,05");
    expect(moneyFormat.format(undefined)).toBe("");
    expect(moneyFormat.format(Number.NaN)).toBe("");
    expect(moneyFormat.format(12.5)).toBe("");
    expect(moneyFormat.format(null as unknown as number)).toBe("");
  });
});

describe("phoneFormat", () => {
  test("should group what was typed without adding digits", () => {
    expect(phoneFormat.mask?.("05321234567")).toBe("0532 123 45 67");
    expect(phoneFormat.mask?.("5321234567")).toBe("532 123 45 67");
    expect(phoneFormat.mask?.("+905321234567")).toBe("+90 532 123 45 67");
    expect(phoneFormat.mask?.("0532-12")).toBe("0532 12");
  });

  test("should parse a complete number to E.164 and keep a partial one as typed", () => {
    expect(phoneFormat.parse("0532 123 45 67")).toBe("+905321234567");
    expect(phoneFormat.parse("0212 123 45 67")).toBe("+902121234567");
    expect(phoneFormat.parse("0532 12")).toBe("0532 12");
  });

  test("should format E.164 for reading", () => {
    expect(phoneFormat.format("+905321234567")).toBe("0532 123 45 67");
    expect(phoneFormat.format("0532 12")).toBe("0532 12");
    expect(phoneFormat.format(undefined as unknown as string)).toBe("");
  });
});

describe("tcknFormat and vknFormat", () => {
  test("should keep digits only, up to 11 and 10", () => {
    expect(tcknFormat.mask?.("1234567890123")).toBe("12345678901");
    expect(vknFormat.mask?.("12a34567890123")).toBe("1234567890");
    expect(tcknFormat.parse("123")).toBe("123");
    expect(vknFormat.format("123")).toBe("123");
    expect(tcknFormat.format(undefined as unknown as string)).toBe("");
  });
});

describe("TR_MESSAGES with @handijitcom/tr checks", () => {
  const schema = z.object({
    tckn: z.string().refine(isTckn, TR_MESSAGES.tckn),
    vkn: z.string().refine(isVkn, TR_MESSAGES.vkn),
    iban: z.string().refine(isIban, TR_MESSAGES.iban),
    phone: z.string().refine(isMobilePhone, TR_MESSAGES.mobilePhone),
    birthDate: z.iso.date(TR_MESSAGES.date),
    price: z.number(TR_MESSAGES.money).int(TR_MESSAGES.money),
  });

  test("should accept what the formats produce from valid input", () => {
    const result = schema.safeParse({
      tckn: tcknFormat.parse("10000000146"),
      vkn: vknFormat.parse("1234567890"),
      iban: ibanFormat.parse("TR33 0006 1005 1978 6457 8413 26"),
      phone: phoneFormat.parse("0532 123 45 67"),
      birthDate: dateFormat.parse("31.12.1990"),
      price: moneyFormat.parse("3.490,00"),
    });
    expect(result.success).toBe(true);
  });

  test("should report each invalid value with its Turkish message", () => {
    const result = schema.safeParse({
      tckn: tcknFormat.parse("12345678901"),
      vkn: vknFormat.parse("1234567891"),
      iban: ibanFormat.parse("TR33 0006"),
      phone: phoneFormat.parse("0212 123 45 67"),
      birthDate: dateFormat.parse("31.02.1990"),
      price: moneyFormat.parse("abc"),
    });
    expect(result.success).toBe(false);
    expect(
      Object.fromEntries(
        result.error?.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]) ?? []
      )
    ).toEqual({
      tckn: TR_MESSAGES.tckn,
      vkn: TR_MESSAGES.vkn,
      iban: TR_MESSAGES.iban,
      phone: TR_MESSAGES.mobilePhone,
      birthDate: TR_MESSAGES.date,
      price: TR_MESSAGES.money,
    });
  });

  test("should be frozen Turkish texts", () => {
    expect(Object.isFrozen(TR_MESSAGES)).toBe(true);
    expect(Object.keys(TR_MESSAGES).sort()).toEqual([
      "date",
      "iban",
      "mobilePhone",
      "money",
      "phone",
      "tckn",
      "vkn",
    ]);
  });
});
