import { describe, expect, test } from "vitest";

import { changeArray, moveKeys } from "../../lib/helpers/array-change.helper";

const movedAll = (moved: (index: number) => number | null, length: number) =>
  Array.from({ length }, (_, index) => moved(index));

describe("changeArray", () => {
  test("should insert and shift the rows after it", () => {
    const { next, moved } = changeArray(["a", "b"], {
      type: "insert",
      index: 1,
      item: "x",
    });
    expect(next).toEqual(["a", "x", "b"]);
    expect(movedAll(moved, 2)).toEqual([0, 2]);
  });

  test("should clamp the insert position", () => {
    expect(
      changeArray(["a"], { type: "insert", index: 9, item: "x" }).next
    ).toEqual(["a", "x"]);
    expect(
      changeArray(["a"], { type: "insert", index: -3, item: "x" }).next
    ).toEqual(["x", "a"]);
  });

  test("should remove rows and close the gaps", () => {
    const { next, moved } = changeArray(["a", "b", "c", "d"], {
      type: "remove",
      indexes: [1, 2],
    });
    expect(next).toEqual(["a", "d"]);
    expect(movedAll(moved, 4)).toEqual([0, null, null, 1]);
  });

  test("should move a row forwards and backwards", () => {
    const forwards = changeArray(["a", "b", "c", "d"], {
      type: "move",
      from: 0,
      to: 2,
    });
    expect(forwards.next).toEqual(["b", "c", "a", "d"]);
    expect(movedAll(forwards.moved, 4)).toEqual([2, 0, 1, 3]);
    const backwards = changeArray(["a", "b", "c", "d"], {
      type: "move",
      from: 3,
      to: 1,
    });
    expect(backwards.next).toEqual(["a", "d", "b", "c"]);
    expect(movedAll(backwards.moved, 4)).toEqual([0, 2, 3, 1]);
  });

  test("should swap two rows and ignore indexes out of range", () => {
    const { next, moved } = changeArray(["a", "b", "c"], {
      type: "swap",
      a: 0,
      b: 2,
    });
    expect(next).toEqual(["c", "b", "a"]);
    expect(movedAll(moved, 3)).toEqual([2, 1, 0]);
    const ignored = changeArray(["a"], { type: "swap", a: 0, b: 5 });
    expect(ignored.next).toEqual(["a"]);
    expect(ignored.moved(0)).toBe(0);
  });

  test("should replace every row", () => {
    const { next, moved } = changeArray(["a"], {
      type: "replace",
      items: ["x", "y"],
    });
    expect(next).toEqual(["x", "y"]);
    expect(moved(0)).toBeNull();
  });
});

describe("moveKeys", () => {
  test("should rename the keys below the array and drop removed rows", () => {
    const record = {
      email: 1,
      "items.0.name": 2,
      "items.1.name": 3,
      "items.1": 4,
      "items.x": 5,
      itemsOther: 6,
    };
    expect(
      moveKeys(record, "items", (index) => (index === 0 ? null : index - 1))
    ).toEqual({
      email: 1,
      "items.0.name": 3,
      "items.0": 4,
      "items.x": 5,
      itemsOther: 6,
    });
  });
});
