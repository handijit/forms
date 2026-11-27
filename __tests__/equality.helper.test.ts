import { describe, expect, test } from "vitest";

import isDeepEqual from "../lib/helpers/is-deep-equal.helper";
import shallowEqual from "../lib/helpers/shallow-equal.helper";

describe("isDeepEqual", () => {
  test("should compare primitives with Object.is", () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isDeepEqual(0, -0)).toBe(false);
    expect(isDeepEqual("a", "b")).toBe(false);
  });

  test("should compare dates by time, invalid dates included", () => {
    expect(isDeepEqual(new Date(5), new Date(5))).toBe(true);
    expect(isDeepEqual(new Date(5), new Date(6))).toBe(false);
    expect(isDeepEqual(new Date(Number.NaN), new Date(Number.NaN))).toBe(true);
  });

  test("should compare arrays item by item", () => {
    expect(isDeepEqual([1, [2]], [1, [2]])).toBe(true);
    expect(isDeepEqual([1], [1, 2])).toBe(false);
    expect(isDeepEqual([1, 2], [1, 3])).toBe(false);
  });

  test("should compare plain objects, an undefined property counting as absent", () => {
    expect(isDeepEqual({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(isDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
    expect(isDeepEqual(Object.create(null), {})).toBe(true);
  });

  test("should compare everything else by identity", () => {
    class Box {}
    expect(isDeepEqual(new Box(), new Box())).toBe(false);
    expect(isDeepEqual([1], { 0: 1 })).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
    const file = new Blob(["x"]);
    expect(isDeepEqual(file, file)).toBe(true);
  });
});

describe("shallowEqual", () => {
  test("should compare one level deep with Object.is", () => {
    const shared = { x: 1 };
    expect(shallowEqual({ a: shared, b: 1 }, { a: shared, b: 1 })).toBe(true);
    expect(shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: 1, b: undefined }, { a: 1, c: undefined })).toBe(
      false
    );
    expect(shallowEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(shallowEqual(1, { a: 1 })).toBe(false);
    expect(shallowEqual({ a: 1 }, 1)).toBe(false);
    expect(shallowEqual(null, {})).toBe(false);
    expect(shallowEqual({}, null)).toBe(false);
  });
});
