import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import createFormStore from "../lib/core/create-form-store";
import { changeArray } from "../lib/helpers/array-change.helper";
import numberFormat from "../lib/modules/number-format";
import { moneyFormat, phoneFormat } from "../lib/tr";

const setup = <TValues>(values: TValues, schema: z.ZodType) =>
  createFormStore(values, () => ({ schema, onSubmit: vi.fn() }));

// Bugs found while porting @handijit/forms 1.1.0 to @handijitcom/forms 1.0.0.
describe("1.0.0", () => {
  test("removing an index that is not a row shifted the state of the rows after it", () => {
    const change = changeArray(["a", "b"], {
      type: "remove",
      indexes: [-1, 5, 0.5],
    });
    expect(change.next).toEqual(["a", "b"]);
    expect([change.moved(0), change.moved(1)]).toEqual([0, 1]);

    const form = setup(
      { items: [{ title: "a" }, { title: "b" }] },
      z.object({ items: z.array(z.object({ title: z.string() })) })
    );
    form.blur("items.1.title");
    form.array("items").remove(-1);
    expect(form.getState().touched).toEqual({ "items.1.title": true });
  });

  test("a NaN index left every row's key and state on the wrong item", () => {
    const change = changeArray(["a", "b"], {
      type: "insert",
      index: Number.NaN,
      item: "x",
    });
    expect(change.next).toEqual(["x", "a", "b"]);
    expect([change.moved(0), change.moved(1)]).toEqual([1, 2]);
    const moved = changeArray(["a", "b"], {
      type: "move",
      from: Number.NaN,
      to: 1,
    });
    expect(moved.next).toEqual(["b", "a"]);
    expect([moved.moved(0), moved.moved(1)]).toEqual([1, 0]);
  });

  test("a server error keyed __proto__ was silently dropped", () => {
    const form = setup({ name: "" }, z.object({ name: z.string() }));
    form.applyServerErrors(JSON.parse('{"__proto__": "Geçersiz alan"}'));
    expect(form.getState().formErrors).toEqual(["Geçersiz alan"]);
  });

  test("numberFormat threw from format for a negative or NaN decimals", () => {
    expect(numberFormat({ decimals: -1 }).format(5)).toBe("5");
    expect(numberFormat({ decimals: Number.NaN }).format(5)).toBe("5");
  });

  test("moneyFormat threw for an amount that is not whole kuruş", () => {
    expect(moneyFormat.format(12.5)).toBe("");
  });

  test("phoneFormat.format crashed on a partial number (@handijitcom/tr returns undefined, not null)", () => {
    expect(phoneFormat.format("0532 12")).toBe("0532 12");
    expect(phoneFormat.format("+905321234567")).toBe("0532 123 45 67");
  });
});
