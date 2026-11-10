import { describe, expect, test } from "vitest";

import isDeepEqual from "../../lib/helpers/is-deep-equal.helper";

describe("isDeepEqual", () => {
  test("should compare primitives with Object.is", () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isDeepEqual(0, -0)).toBe(false);
    expect(isDeepEqual("a", "b")).toBe(false);
  });

  test("should compare dates by time", () => {
    expect(isDeepEqual(new Date(1), new Date(1))).toBe(true);
    expect(isDeepEqual(new Date(1), new Date(2))).toBe(false);
  });

  test("should compare arrays item by item", () => {
    expect(isDeepEqual([1, [2]], [1, [2]])).toBe(true);
    expect(isDeepEqual([1], [1, 2])).toBe(false);
    expect(isDeepEqual([1, 2], [1, 3])).toBe(false);
  });

  test("should compare plain objects and ignore undefined properties", () => {
    expect(isDeepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(isDeepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
    expect(isDeepEqual(Object.create(null), {})).toBe(true);
  });

  test("should compare everything else by identity", () => {
    class Box {}
    expect(isDeepEqual(new Box(), new Box())).toBe(false);
    expect(isDeepEqual([], {})).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
  });
});
