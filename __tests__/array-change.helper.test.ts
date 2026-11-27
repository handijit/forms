import { describe, expect, test } from "vitest";

import { changeArray, moveKeys } from "../lib/helpers/array-change.helper";

const ROWS = ["a", "b", "c", "d"] as const;

const movedOf = (change: ReturnType<typeof changeArray>): (number | null)[] =>
  ROWS.map((_, index) => change.moved(index));

describe("changeArray", () => {
  test("should insert at a clamped index and shift the rows after it", () => {
    const change = changeArray(ROWS, { type: "insert", index: 1, item: "x" });
    expect(change.next).toEqual(["a", "x", "b", "c", "d"]);
    expect(movedOf(change)).toEqual([0, 2, 3, 4]);
    expect(
      changeArray(ROWS, { type: "insert", index: 99, item: "x" }).next
    ).toEqual(["a", "b", "c", "d", "x"]);
    expect(
      changeArray(ROWS, { type: "insert", index: -5, item: "x" }).next
    ).toEqual(["x", "a", "b", "c", "d"]);
    expect(
      changeArray(ROWS, { type: "insert", index: 1.9, item: "x" }).next
    ).toEqual(["a", "x", "b", "c", "d"]);
  });

  test("should remove several rows and close the gaps", () => {
    const change = changeArray(ROWS, { type: "remove", indexes: [1, 3, 1] });
    expect(change.next).toEqual(["a", "c"]);
    expect(movedOf(change)).toEqual([0, null, 1, null]);
  });

  test("should move a row forwards and backwards", () => {
    const forwards = changeArray(ROWS, { type: "move", from: 0, to: 2 });
    expect(forwards.next).toEqual(["b", "c", "a", "d"]);
    expect(movedOf(forwards)).toEqual([2, 0, 1, 3]);
    const backwards = changeArray(ROWS, { type: "move", from: 3, to: 1 });
    expect(backwards.next).toEqual(["a", "d", "b", "c"]);
    expect(movedOf(backwards)).toEqual([0, 2, 3, 1]);
  });

  test("should clamp a move to the last row and do nothing on an empty array", () => {
    expect(changeArray(ROWS, { type: "move", from: 9, to: 0 }).next).toEqual([
      "d",
      "a",
      "b",
      "c",
    ]);
    expect(changeArray([], { type: "move", from: 0, to: 1 }).next).toEqual([]);
  });

  test("should swap two rows and ignore indexes that are not rows", () => {
    const change = changeArray(ROWS, { type: "swap", a: 0, b: 3 });
    expect(change.next).toEqual(["d", "b", "c", "a"]);
    expect(movedOf(change)).toEqual([3, 1, 2, 0]);
    const ignored = changeArray(ROWS, { type: "swap", a: 0, b: 7 });
    expect(ignored.next).toEqual([...ROWS]);
    expect(movedOf(ignored)).toEqual([0, 1, 2, 3]);
  });

  test("should replace every row, keeping no old row", () => {
    const change = changeArray(ROWS, { type: "replace", items: ["z"] });
    expect(change.next).toEqual(["z"]);
    expect(movedOf(change)).toEqual([null, null, null, null]);
  });

  test("should not mutate the input", () => {
    const input = ["a", "b"];
    changeArray(input, { type: "move", from: 0, to: 1 });
    changeArray(input, { type: "swap", a: 0, b: 1 });
    expect(input).toEqual(["a", "b"]);
  });
});

describe("moveKeys", () => {
  test("should rename the keys of moved rows, drop removed rows and keep the rest", () => {
    const record = {
      name: 1,
      items: 2,
      "items.0": 3,
      "items.1.title": 4,
      "items.2.title": 5,
      "items.extra": 6,
      "other.0": 7,
    };
    const moved = (index: number): number | null =>
      index === 1 ? null : index === 2 ? 1 : index;
    expect(moveKeys(record, "items", moved)).toEqual({
      name: 1,
      items: 2,
      "items.0": 3,
      "items.1.title": 5,
      "items.extra": 6,
      "other.0": 7,
    });
  });
});
