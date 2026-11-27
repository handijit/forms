import { describe, expect, test } from "vitest";

import { caretAfterMask } from "../lib/helpers/caret.helper";

describe("caretAfterMask", () => {
  test("should keep the caret after the same number of significant characters", () => {
    // "1234|" typed, the mask groups it to "1.234": the caret stays after the fourth digit.
    expect(caretAfterMask("1234", 4, "1.234")).toBe(5);
    // "12|34": after the second digit.
    expect(caretAfterMask("1234", 2, "1.234")).toBe(3);
  });

  test("should put the caret at the start when nothing significant precedes it", () => {
    expect(caretAfterMask(" 12", 1, "12")).toBe(0);
  });

  test("should end at the text end when the mask dropped characters", () => {
    expect(caretAfterMask("12345", 5, "12")).toBe(2);
  });

  test("should count letters of any script", () => {
    expect(caretAfterMask("tr33ı", 5, "TR33 I")).toBe(6);
  });
});
