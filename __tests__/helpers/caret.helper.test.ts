import { describe, expect, test } from "vitest";

import { caretAfterMask } from "../../lib/helpers/caret.helper";

describe("caretAfterMask", () => {
  test("should keep the caret after the same significant characters", () => {
    // "0532123" typed, caret at the end; the mask grouped it.
    expect(caretAfterMask("0532123", 7, "0532 123")).toBe(8);
    // Caret after "05", in the middle.
    expect(caretAfterMask("0532123", 2, "0532 123")).toBe(2);
    expect(caretAfterMask("0532123", 5, "0532 123")).toBe(6);
  });

  test("should put the caret at the start when nothing significant precedes it", () => {
    expect(caretAfterMask(" 12", 1, "12")).toBe(0);
  });

  test("should fall back to the end when the mask dropped characters", () => {
    expect(caretAfterMask("12345", 5, "12")).toBe(2);
  });
});
