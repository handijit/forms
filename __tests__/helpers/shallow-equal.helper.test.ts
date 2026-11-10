import { describe, expect, test } from "vitest";

import shallowEqual from "../../lib/helpers/shallow-equal.helper";

describe("shallowEqual", () => {
  test("should accept the same value", () => {
    expect(shallowEqual(1, 1)).toBe(true);
  });

  test("should compare objects one level deep", () => {
    const inner = {};
    expect(shallowEqual({ a: 1, b: inner }, { a: 1, b: inner })).toBe(true);
    expect(shallowEqual({ a: {} }, { a: {} })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: 1, c: 1 }, { a: 1, b: 1 })).toBe(false);
  });

  test("should reject non-objects that differ", () => {
    expect(shallowEqual(1, 2)).toBe(false);
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
    expect(shallowEqual("a", {})).toBe(false);
  });
});
