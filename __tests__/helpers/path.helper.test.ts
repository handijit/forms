import { describe, expect, test } from "vitest";

import {
  getPath,
  isIndex,
  isRelated,
  isWithin,
  joinPath,
  normalizeServerPath,
  setPath,
  splitPath,
} from "../../lib/helpers/path.helper";

describe("path helpers", () => {
  test("should split a dotted path and treat the empty path as the root", () => {
    expect(splitPath("a.0.b")).toEqual(["a", "0", "b"]);
    expect(splitPath("")).toEqual([]);
  });

  test("should recognise array indexes", () => {
    expect(isIndex("0")).toBe(true);
    expect(isIndex("12")).toBe(true);
    expect(isIndex("01")).toBe(false);
    expect(isIndex("a")).toBe(false);
  });

  test("should read nested values and stop at missing branches", () => {
    const value = { a: { list: [{ b: 1 }] }, n: null };
    expect(getPath(value, "a.list.0.b")).toBe(1);
    expect(getPath(value, "a.missing.b")).toBeUndefined();
    expect(getPath(value, "n.x")).toBeUndefined();
    expect(getPath(value, "")).toBe(value);
  });

  test("should write without mutating and keep untouched branches", () => {
    const value = { a: { b: 1 }, c: { d: 2 }, list: [1, 2] };
    const next = setPath(value, "a.b", 5);
    expect(next).toEqual({ a: { b: 5 }, c: { d: 2 }, list: [1, 2] });
    expect(value.a.b).toBe(1);
    expect(next.c).toBe(value.c);
    expect(setPath(value, "list.1", 9).list).toEqual([1, 9]);
    expect(setPath(value, "", 3)).toBe(3);
  });

  test("should create missing containers as the next segment asks", () => {
    expect(setPath({}, "a.0.b", 1)).toEqual({ a: [{ b: 1 }] });
    expect(setPath({ a: null }, "a.b", 1)).toEqual({ a: { b: 1 } });
  });

  test("should relate paths along one branch only", () => {
    expect(isWithin("a.b", "a")).toBe(true);
    expect(isWithin("a", "a")).toBe(true);
    expect(isWithin("ab", "a")).toBe(false);
    expect(isWithin("x", "")).toBe(true);
    expect(isRelated("a", "a.b")).toBe(true);
    expect(isRelated("a.b", "a")).toBe(true);
    expect(isRelated("a.b", "a.c")).toBe(false);
  });

  test("should join issue paths and normalise server field names", () => {
    expect(joinPath(["items", 0, "name"])).toBe("items.0.name");
    expect(normalizeServerPath("items[0].name")).toBe("items.0.name");
    expect(normalizeServerPath("/items/0/name")).toBe("items.0.name");
    expect(normalizeServerPath("email")).toBe("email");
  });
});
