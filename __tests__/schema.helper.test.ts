import { describe, expect, test } from "vitest";
import { z } from "zod";
import * as zm from "zod/mini";

import {
  isRequiredSchema,
  runSchema,
  schemaAt,
} from "../lib/helpers/schema.helper";

describe("runSchema", () => {
  test("should reduce issues to one message per path", () => {
    const schema = z.object({
      email: z.email("E-posta geçersiz"),
      items: z.array(z.object({ title: z.string().min(1, "Başlık gerekli") })),
      password: z.string().min(8, "Kısa").max(4, "Uzun"),
    });
    expect(
      runSchema(
        schema,
        { email: "x", items: [{ title: "" }], password: "123456" },
        false
      )
    ).toMatchObject({
      data: undefined,
      errors: {
        email: "E-posta geçersiz",
        "items.0.title": "Başlık gerekli",
        password: "Kısa",
      },
    });
  });

  test("should report root refinements as form errors, each message once", () => {
    const schema = z.object({ name: z.string() }).superRefine((_, context) => {
      context.addIssue({ code: "custom", message: "Form hatası" });
      context.addIssue({ code: "custom", message: "Form hatası" });
    });
    expect(runSchema(schema, { name: "x" }, false)).toEqual({
      data: undefined,
      errors: {},
      formErrors: ["Form hatası"],
    });
  });

  test("should return the parsed data on success", () => {
    const coerce = z.object({ age: z.coerce.number() });
    expect(runSchema(coerce, { age: "42" }, false)).toEqual({
      data: { age: 42 },
      errors: {},
      formErrors: [],
    });
  });

  test("should switch to async parsing when the schema is async", async () => {
    const async = z.object({
      name: z.string().refine(async (value) => value !== "taken", "Alındı"),
    });
    const result = runSchema(async, { name: "taken" }, false);
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatchObject({ errors: { name: "Alındı" } });
    await expect(runSchema(async, { name: "ok" }, true)).resolves.toMatchObject(
      {
        data: { name: "ok" },
      }
    );
  });

  test("should rethrow an error that is not Zod's async error", () => {
    const throwing = z.object({
      name: z.string().refine(() => {
        throw new TypeError("boom");
      }),
    });
    expect(() => runSchema(throwing, { name: "x" }, false)).toThrow("boom");
  });

  test("should accept zod/mini schemas", () => {
    const mini = zm.object({
      name: zm.string().check(zm.minLength(2, "Kısa")),
    });
    expect(runSchema(mini, { name: "a" }, false)).toMatchObject({
      errors: { name: "Kısa" },
    });
  });
});

describe("schemaAt", () => {
  const leaf = z.string();
  const schema = z.object({
    profile: z
      .object({ name: leaf })
      .optional()
      .nullable()
      .default({ name: "" })
      .readonly(),
    tags: z.array(leaf),
    pair: z.tuple([z.number(), leaf]),
    rest: z.tuple([z.number()], leaf),
    map: z.record(z.string(), z.number()),
    piped: z.string().transform((value) => value.length),
    lazy: z.lazy(() => z.object({ deep: leaf })),
    caught: z.object({ inner: leaf }).catch({ inner: "" }),
  });

  test("should follow objects, arrays, tuples, records and wrappers", () => {
    expect(schemaAt(schema, "profile.name")).toBe(leaf);
    expect(schemaAt(schema, "tags.3")).toBe(leaf);
    expect(schemaAt(schema, "pair.1")).toBe(leaf);
    expect(schemaAt(schema, "rest.5")).toBe(leaf);
    expect(schemaAt(schema, "lazy.deep")).toBe(leaf);
    expect(schemaAt(schema, "caught.inner")).toBe(leaf);
    expect(schemaAt(schema, "map.any")).toBeDefined();
    expect(schemaAt(schema, "")).toBe(schema);
  });

  test("should give up where the walk cannot follow", () => {
    expect(schemaAt(schema, "tags.first")).toBeUndefined();
    expect(schemaAt(schema, "pair.x")).toBeUndefined();
    expect(schemaAt(schema, "pair.5")).toBeUndefined();
    expect(schemaAt(schema, "missing.deeper")).toBeUndefined();
    expect(schemaAt(schema, "piped.length")).toBeUndefined();
  });
});

describe("isRequiredSchema", () => {
  test("should call a field required when it rejects every empty value", () => {
    expect(isRequiredSchema(z.string().min(1))).toBe(true);
    expect(isRequiredSchema(z.number())).toBe(true);
    expect(isRequiredSchema(z.literal(true))).toBe(true);
    expect(isRequiredSchema(z.array(z.string()).min(1))).toBe(true);
  });

  test("should not call a field required when an empty value passes", () => {
    expect(isRequiredSchema(z.string())).toBe(false);
    expect(isRequiredSchema(z.boolean())).toBe(false);
    expect(isRequiredSchema(z.number().optional())).toBe(false);
    expect(isRequiredSchema(z.array(z.string()))).toBe(false);
    expect(isRequiredSchema(undefined)).toBe(false);
  });

  test("should not call an async refinement required", () => {
    expect(
      isRequiredSchema(z.string().refine(async (value) => value !== ""))
    ).toBe(false);
  });
});
