import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod";

import {
  numberFormat,
  useField,
  useFieldArray,
  useForm,
  useWatch,
  type FieldArrayPath,
  type FieldPath,
  type FieldPathByValue,
  type FieldPathValue,
  type FormApi,
  type ServerErrors,
} from "../lib/index";
import { moneyFormat, phoneFormat } from "../lib/tr";
import { CheckboxField, fieldsOf, TagInputField, TextField } from "../lib/ui";

const schema = z.object({
  email: z.email(),
  age: z.coerce.number(),
  joined: z.string().transform((value) => new Date(value)),
  address: z
    .object({ city: z.string(), zip: z.string().optional() })
    .optional(),
  items: z.array(z.object({ title: z.string(), price: z.number() })),
  tags: z.array(z.string()),
  terms: z.boolean(),
  pair: z.tuple([z.string(), z.number()]),
});

type Input = z.input<typeof schema>;
type Output = z.output<typeof schema>;

// The calls below are only type-checked; they never run.
const neverRun = (callback: () => void): void => {
  void callback;
};

describe("the types", () => {
  test("should list every path of the input type", () => {
    expectTypeOf<FieldPath<{ a: string; b: { c: number } }>>().toEqualTypeOf<
      "a" | "b" | "b.c"
    >();
    expectTypeOf<"items.0.title">().toExtend<FieldPath<Input>>();
    expectTypeOf<"address.zip">().toExtend<FieldPath<Input>>();
    expectTypeOf<"pair.1">().toExtend<FieldPath<Input>>();
    expectTypeOf<"nope">().not.toExtend<FieldPath<Input>>();
    expectTypeOf<"email.length">().not.toExtend<FieldPath<Input>>();
    expectTypeOf<FieldPath<unknown>>().toEqualTypeOf<string>();
  });

  test("should give the value type of a path, with undefined under an optional parent", () => {
    expectTypeOf<
      FieldPathValue<Input, "items.0.price">
    >().toEqualTypeOf<number>();
    expectTypeOf<FieldPathValue<Input, "address.city">>().toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<FieldPathValue<Input, "pair.0">>().toEqualTypeOf<string>();
    // z.coerce takes anything in.
    expectTypeOf<FieldPathValue<Input, "age">>().toEqualTypeOf<unknown>();
  });

  test("should select array paths and paths by value", () => {
    expectTypeOf<FieldArrayPath<Input>>().toEqualTypeOf<
      "items" | "tags" | "pair"
    >();
    expectTypeOf<"terms">().toExtend<FieldPathByValue<Input, boolean>>();
    expectTypeOf<"email">().not.toExtend<FieldPathByValue<Input, boolean>>();
    // An unknown value fits any binder.
    expectTypeOf<"age">().toExtend<FieldPathByValue<Input, boolean>>();
  });

  test("should type the form from the schema: input values, output on submit", () => {
    neverRun(() => {
      const form = useForm({
        schema,
        defaultValues: { email: "", tags: [] },
        onSubmit: (values) => {
          expectTypeOf(values).toEqualTypeOf<Output>();
          expectTypeOf(values.joined).toEqualTypeOf<Date>();
          expectTypeOf(values.age).toEqualTypeOf<number>();
        },
      });
      expectTypeOf(form).toEqualTypeOf<FormApi<Input>>();
      expectTypeOf(form.getValue("joined")).toEqualTypeOf<string>();
      expectTypeOf(useWatch(form, "items.0.title")).toEqualTypeOf<string>();
      expectTypeOf(useField(form, "address.city").value).toEqualTypeOf<
        string | undefined
      >();
      form.setValue("items.0.price", 3);
      // @ts-expect-error a value of the wrong type must not compile
      form.setValue("items.0.price", "3");
      // @ts-expect-error a path that does not exist must not compile
      form.setValue("items.0.cost", 3);
      const rows = useFieldArray(form, "items");
      rows.append({ title: "", price: 0 });
      // @ts-expect-error an item of the wrong shape must not compile
      rows.append({ title: "" });
      // @ts-expect-error only array paths take array operations
      useFieldArray(form, "email");
      form.applyServerErrors({ status: 400, fields: ["items[0].title"] });
      form.applyServerErrors({ email: "Kayıtlı", tags: ["Boş", "Uzun"] });
      expectTypeOf<{ status: number }>().toExtend<ServerErrors>();
    });
  });

  test("should check binder names against the form", () => {
    neverRun(() => {
      const form = useForm({
        schema,
        defaultValues: {},
        onSubmit: () => undefined,
      });
      void (<TextField form={form} name="items.0.title" label="Başlık" />);
      // @ts-expect-error a name that is not a path of the form must not compile
      void (<TextField form={form} name="itemz" label="x" />);
      void (<CheckboxField form={form} name="terms" label="Koşullar" />);
      // @ts-expect-error a checkbox binds a boolean field only
      void (<CheckboxField form={form} name="email" label="x" />);
      void (
        <TagInputField
          form={form}
          name="tags"
          label="Etiketler"
          removeLabel="Kaldır"
        />
      );
      void (
        <TagInputField
          form={form}
          // @ts-expect-error a tag input binds a string[] field only
          name="terms"
          label="x"
          removeLabel="Kaldır"
        />
      );

      const f = fieldsOf(form);
      void (<f.TextField name="address.city" label="Şehir" />);
      // @ts-expect-error fieldsOf keeps the names checked
      void (<f.TextField name="address.town" label="x" />);

      // Without a typed form, any name goes.
      void (<TextField name="anything" label="x" />);
      void (<TextField name="phone" label="Telefon" format={phoneFormat} />);
      void (<TextField name="price" label="Fiyat" format={moneyFormat} />);
      void (
        <TextField name="n" label="n" format={numberFormat({ decimals: 2 })} />
      );
    });
  });
});
