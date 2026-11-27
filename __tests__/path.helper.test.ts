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
} from "../lib/helpers/path.helper";

describe("path helper", () => {
  test("should split dotted paths, the empty path being the root", () => {
    expect(splitPath("")).toEqual([]);
    expect(splitPath("items.0.title")).toEqual(["items", "0", "title"]);
  });

  test("should recognise array indexes without leading zeros", () => {
    expect(isIndex("0")).toBe(true);
    expect(isIndex("12")).toBe(true);
    expect(isIndex("01")).toBe(false);
    expect(isIndex("-1")).toBe(false);
    expect(isIndex("a")).toBe(false);
  });

  test("should read nested values and stop at non-objects", () => {
    const value = { a: { b: [{ c: 1 }] }, n: null };
    expect(getPath(value, "a.b.0.c")).toBe(1);
    expect(getPath(value, "")).toBe(value);
    expect(getPath(value, "n.x")).toBeUndefined();
    expect(getPath(value, "a.missing.deep")).toBeUndefined();
    expect(getPath(7, "x")).toBeUndefined();
  });

  test("should write by copying every container on the way down", () => {
    const value = { a: { b: [1, 2] }, keep: { k: 1 } };
    const next = setPath(value, "a.b.1", 9);
    expect(next).toEqual({ a: { b: [1, 9] }, keep: { k: 1 } });
    expect(value.a.b).toEqual([1, 2]);
    expect(next.keep).toBe(value.keep);
    expect(next.a).not.toBe(value.a);
  });

  test("should create missing containers as the segment asks", () => {
    expect(setPath({}, "list.1.name", "x")).toEqual({
      list: [undefined, { name: "x" }],
    });
    expect(setPath({ a: null }, "a.b", 1)).toEqual({ a: { b: 1 } });
    expect(setPath({ a: 1 }, "", { b: 2 })).toEqual({ b: 2 });
  });

  test("should keep a __proto__ segment an own property", () => {
    const next = setPath({}, "__proto__.polluted", true) as Record<
      string,
      unknown
    >;
    expect(Object.hasOwn(next, "__proto__")).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  test("should tell containment and relation apart", () => {
    expect(isWithin("a.b", "a")).toBe(true);
    expect(isWithin("a", "a")).toBe(true);
    expect(isWithin("ab", "a")).toBe(false);
    expect(isWithin("anything", "")).toBe(true);
    expect(isRelated("a", "a.b")).toBe(true);
    expect(isRelated("a.b", "a")).toBe(true);
    expect(isRelated("a.b", "a.c")).toBe(false);
  });

  test("should join issue paths and normalise server paths", () => {
    expect(joinPath(["items", 0, "title"])).toBe("items.0.title");
    expect(normalizeServerPath("items[0].name")).toBe("items.0.name");
    expect(normalizeServerPath("/items/0/title")).toBe("items.0.title");
    expect(normalizeServerPath("email")).toBe("email");
    expect(normalizeServerPath("")).toBe("");
  });
});
