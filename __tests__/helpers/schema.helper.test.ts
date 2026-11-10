import { describe, expect, test } from "vitest";
import { z } from "zod";
import * as mini from "zod/mini";

import {
  isRequiredSchema,
  runSchema,
  schemaAt,
} from "../../lib/helpers/schema.helper";

describe("runSchema", () => {
  test("should return the data of a valid value", () => {
    const schema = z.object({ age: z.coerce.number() });
    expect(runSchema(schema, { age: "3" }, false)).toEqual({
      data: { age: 3 },
      errors: {},
      formErrors: [],
    });
  });

  test("should keep the first message per path and put root issues apart", () => {
    const schema = z
      .object({ a: z.string().min(2, "short").email("email") })
      .refine(() => false, "root")
      .refine(() => false, "root");
    const result = runSchema(schema, { a: "x" }, false);
    expect(result).toEqual({
      data: undefined,
      errors: { a: "short" },
      formErrors: ["root"],
    });
  });

  test("should go async when the schema needs it", async () => {
    const schema = z.object({
      a: z.string().refine(async (value) => value === "ok", "taken"),
    });
    const result = runSchema(schema, { a: "no" }, false);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual({
      data: undefined,
      errors: { a: "taken" },
      formErrors: [],
    });
    await expect(runSchema(schema, { a: "ok" }, true)).resolves.toMatchObject({
      data: { a: "ok" },
    });
  });

  test("should let other errors through", () => {
    const schema = z.object({}).superRefine(() => {
      throw new Error("bug");
    });
    expect(() => runSchema(schema, {}, false)).toThrow("bug");
  });
});

describe("schemaAt", () => {
  const schema = z.object({
    name: z.string(),
    address: z.object({ city: z.string() }).optional(),
    items: z.array(z.object({ price: z.number() })),
    pair: z.tuple([z.string(), z.number()], z.boolean()),
    tags: z.record(z.string(), z.number()),
    trimmed: z.string().transform((value) => value.trim()),
    lazy: z.lazy(() => z.object({ deep: z.string() })),
    either: z.union([z.string(), z.number()]),
  });

  test("should walk objects, arrays, tuples, records and wrappers", () => {
    expect(schemaAt(schema, "name")?._zod.def.type).toBe("string");
    expect(schemaAt(schema, "address.city")?._zod.def.type).toBe("string");
    expect(schemaAt(schema, "items.0.price")?._zod.def.type).toBe("number");
    expect(schemaAt(schema, "pair.1")?._zod.def.type).toBe("number");
    expect(schemaAt(schema, "pair.5")?._zod.def.type).toBe("boolean");
    expect(schemaAt(schema, "tags.any")?._zod.def.type).toBe("number");
    expect(schemaAt(schema, "trimmed")?._zod.def.type).toBe("pipe");
    expect(schemaAt(schema, "lazy.deep")?._zod.def.type).toBe("string");
  });

  test("should stop where it cannot follow", () => {
    expect(schemaAt(schema, "missing")).toBeUndefined();
    expect(schemaAt(schema, "missing.deeper")).toBeUndefined();
    expect(schemaAt(schema, "items.x")).toBeUndefined();
    expect(schemaAt(schema, "pair.x")).toBeUndefined();
    expect(schemaAt(schema, "either.x")).toBeUndefined();
    expect(
      schemaAt(z.object({ t: z.tuple([z.string()]) }), "t.3")
    ).toBeUndefined();
  });

  test("should walk through a transformed parent to its input side", () => {
    const transformed = z
      .object({ a: z.string() })
      .transform((value) => ({ ...value, b: 1 }));
    expect(schemaAt(transformed, "a")?._zod.def.type).toBe("string");
  });

  test("should walk zod/mini schemas too", () => {
    const schemaMini = mini.object({ a: mini.optional(mini.string()) });
    expect(schemaAt(schemaMini, "a")?._zod.def.type).toBe("optional");
  });
});

describe("isRequiredSchema", () => {
  test("should call a field required when it rejects every empty value", () => {
    expect(isRequiredSchema(z.string().min(1))).toBe(true);
    expect(isRequiredSchema(z.email())).toBe(true);
    expect(isRequiredSchema(z.number())).toBe(true);
    expect(isRequiredSchema(z.literal(true))).toBe(true);
    expect(isRequiredSchema(z.enum(["a", "b"]))).toBe(true);
    expect(isRequiredSchema(z.array(z.string()).min(1))).toBe(true);
  });

  test("should call a field optional when it takes an empty value", () => {
    expect(isRequiredSchema(z.string())).toBe(false);
    expect(isRequiredSchema(z.number().optional())).toBe(false);
    expect(isRequiredSchema(z.boolean())).toBe(false);
    expect(isRequiredSchema(z.array(z.string()))).toBe(false);
    expect(isRequiredSchema(z.string().nullable())).toBe(false);
    expect(isRequiredSchema(undefined)).toBe(false);
  });

  test("should not call an async field required", () => {
    expect(isRequiredSchema(z.string().refine(async () => false))).toBe(false);
  });
});
