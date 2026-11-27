import { describe, expect, expectTypeOf, test } from "vitest";
import { z } from "zod";

import type {
  DeepPartial,
  FieldArrayItem,
  FieldArrayPath,
  FieldFormat,
  FieldPath,
  FieldPathByValue,
  FieldPathValue,
  FormApi,
  FormState,
  SubmitHelpers,
  UseFieldResult,
} from "../lib/index";
import {
  numberFormat,
  useField,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from "../lib/index";
import type { useForm } from "../lib/index";
import {
  dateFormat,
  moneyFormat,
  phoneFormat,
  TR_MESSAGES,
  type TrMessages,
} from "../lib/tr";
import type {
  CheckboxFieldProps,
  FieldsOf,
  FileUploadFieldProps,
  MoneyFieldProps,
  TagInputFieldProps,
  TextFieldProps,
} from "../lib/ui";
import { fieldsOf } from "../lib/ui";

const schema = z.object({
  name: z.string(),
  age: z.string().transform(Number),
  isActive: z.boolean(),
  tags: z.array(z.string()),
  address: z
    .object({ city: z.string(), zip: z.string().optional() })
    .optional(),
  items: z.array(z.object({ title: z.string(), price: z.number() })),
  files: z.array(z.instanceof(File)),
  count: z.coerce.number(),
  createdAt: z.date(),
});
type Values = z.input<typeof schema>;

// Never called: the bodies exist for the type checker only.
const form = null as unknown as FormApi<Values>;

describe("path types", () => {
  test("should describe values the schema accepts", () => {
    const sample: Values = {
      name: "Ada",
      age: "36",
      isActive: true,
      tags: [],
      items: [{ title: "Kalem", price: 5 }],
      files: [],
      count: "3",
      createdAt: new Date(0),
    };
    expect(schema.safeParse(sample).success).toBe(true);
  });

  test("should list every dotted path, stopping at leaves", () => {
    expectTypeOf<"name">().toExtend<FieldPath<Values>>();
    expectTypeOf<"address.city">().toExtend<FieldPath<Values>>();
    expectTypeOf<"items.3.price">().toExtend<FieldPath<Values>>();
    expectTypeOf<"createdAt">().toExtend<FieldPath<Values>>();
    expectTypeOf<"createdAt.getTime">().not.toExtend<FieldPath<Values>>();
    expectTypeOf<"nope">().not.toExtend<FieldPath<Values>>();
    expectTypeOf<FieldPath<unknown>>().toEqualTypeOf<string>();
  });

  test("should type the value at a path, an optional parent adding undefined", () => {
    expectTypeOf<
      FieldPathValue<Values, "items.0.price">
    >().toEqualTypeOf<number>();
    expectTypeOf<FieldPathValue<Values, "address.city">>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<FieldPathValue<Values, "age">>().toEqualTypeOf<string>();
    expectTypeOf<FieldPathValue<unknown, "x">>().toEqualTypeOf<unknown>();
  });

  test("should pick array paths and paths by value", () => {
    expectTypeOf<FieldArrayPath<Values>>().toEqualTypeOf<
      "tags" | "items" | "files"
    >();
    expectTypeOf<FieldArrayItem<Values, "items">>().toEqualTypeOf<{
      title: string;
      price: number;
    }>();
    expectTypeOf<
      FieldPathByValue<Values, boolean | null | undefined>
    >().toEqualTypeOf<"isActive" | "count">();
  });

  test("should make defaults optional all the way down, leaves whole", () => {
    expectTypeOf<DeepPartial<Values>["address"]>().toEqualTypeOf<
      { city?: string; zip?: string | undefined } | undefined
    >();
    expectTypeOf<DeepPartial<{ at: Date }>>().toEqualTypeOf<{ at?: Date }>();
  });
});

describe("hook and form types", () => {
  test("should type a form from the schema's input and submit its output", () => {
    expectTypeOf<ReturnType<typeof useForm<typeof schema>>>().toEqualTypeOf<
      FormApi<Values>
    >();
    expectTypeOf<
      Parameters<typeof useForm<typeof schema>>[0]["onSubmit"]
    >().parameters.toEqualTypeOf<
      [z.output<typeof schema>, SubmitHelpers<Values>]
    >();
  });

  test("should type values and setters by path", () => {
    const check = (): void => {
      expectTypeOf(form.getValue("items.0.title")).toEqualTypeOf<string>();
      form.setValue("isActive", true);
      // @ts-expect-error a boolean field takes no string
      form.setValue("isActive", "yes");
      // @ts-expect-error no such path
      form.blur("nope");
      form.array("items").append({ title: "", price: 0 });
      // @ts-expect-error a row needs its fields
      form.array("items").append({ title: "" });
      // @ts-expect-error not an array
      form.array("name");
    };
    expect(check).toBeTypeOf("function");
  });

  test("should type what the hooks return", () => {
    expectTypeOf(useField<Values, "age">).returns.toEqualTypeOf<
      UseFieldResult<string>
    >();
    expectTypeOf(useWatch<Values, "tags">).returns.toEqualTypeOf<string[]>();
    expectTypeOf(useFormState<Values>).returns.toEqualTypeOf<
      FormState<Values>
    >();
    expectTypeOf(useFormContext<Values>).returns.toEqualTypeOf<
      FormApi<Values>
    >();
    expectTypeOf(useFieldArray<Values, "items">).returns.toHaveProperty("rows");
    expectTypeOf(numberFormat).returns.toEqualTypeOf<
      FieldFormat<number | undefined>
    >();
  });
});

describe("binder types", () => {
  test("should check a binder's name against the form's values", () => {
    expectTypeOf<
      TextFieldProps<Values, "name">["name"]
    >().toEqualTypeOf<"name">();
    // @ts-expect-error a checkbox writes booleans only
    const checkbox: CheckboxFieldProps<Values, "name"> = {
      name: "name",
      label: "x",
    };
    const tags: TagInputFieldProps<Values, "tags"> = {
      name: "tags",
      label: "Etiketler",
      removeLabel: "Kaldır",
    };
    // @ts-expect-error a file upload writes File[] only
    const upload: FileUploadFieldProps<Values, "tags"> = { name: "tags" };
    // @ts-expect-error a money field writes numbers only
    const money: MoneyFieldProps<Values, "name"> = { name: "name" };
    expect([checkbox, tags, upload, money]).toHaveLength(4);
  });

  test("should type the binders of fieldsOf for one form", () => {
    expectTypeOf(fieldsOf(form)).toEqualTypeOf<FieldsOf<Values>>();
    const check = (): void => {
      const fields = fieldsOf(form);
      expectTypeOf(fields.TextField<"address.city">)
        .parameter(0)
        .toHaveProperty("name")
        .toEqualTypeOf<"address.city">();
      // @ts-expect-error a typo in the name does not compile
      fields.TextField({ name: "adress.city", label: "Şehir" });
    };
    expect(check).toBeTypeOf("function");
  });
});

describe("Turkish format types", () => {
  test("should type each format's value", () => {
    expectTypeOf(dateFormat).toEqualTypeOf<FieldFormat<string>>();
    expectTypeOf(phoneFormat).toEqualTypeOf<FieldFormat<string>>();
    expectTypeOf(moneyFormat).toEqualTypeOf<FieldFormat<number | undefined>>();
    expectTypeOf(TR_MESSAGES).toEqualTypeOf<Readonly<TrMessages>>();
  });
});
