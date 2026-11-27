import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import { moneyFormat } from "../lib/tr";
import {
  DateField,
  MoneyField,
  NumberField,
  PasswordField,
  PercentField,
  QuantityInputField,
  RateField,
  TextareaField,
  TextField,
} from "../lib/ui";
import { renderForm } from "./fixtures/ui";

const schema = z.object({
  name: z.string().min(2, "Ad kısa"),
  bio: z.string(),
  password: z.string().min(8, "En az 8 karakter"),
  birthDate: z.string(),
  age: z.number().optional(),
  price: z.number().optional(),
});
type Values = z.input<typeof schema>;
const DEFAULTS: Values = { name: "", bio: "", password: "", birthDate: "" };

describe("TextField", () => {
  test("should bind the input, label, hint and required mark from the schema", async () => {
    const { user, form, container } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <TextField
        name="name"
        label="Ad soyad"
        hint="Kimlikteki gibi"
        className="wide"
      />
    );
    const input = screen.getByRole("textbox", { name: /Ad soyad/ });
    expect(input).toHaveProperty("required", true);
    expect(input.getAttribute("aria-describedby")).toBe(`${input.id}-hint`);
    expect(container.querySelector(".wide")).not.toBeNull();
    await user.type(input, "Ada");
    expect(form.getValue("name")).toBe("Ada");
    expect(form.getFieldLabel("name")).toBe("Ad soyad");
  });

  test("should show the error under the field and link it", async () => {
    const { user } = renderForm(
      { schema, defaultValues: DEFAULTS, mode: "blur" },
      <TextField name="name" label="Ad" />
    );
    const input = screen.getByRole("textbox", { name: /Ad/ });
    await user.type(input, "A");
    await user.tab();
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain("Ad kısa");
    expect(input.getAttribute("aria-describedby")).toBe(`${input.id}-error`);
  });

  test("should take a rich label with a summary label, and override required", () => {
    const { form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <TextField
          name="name"
          label={<abbr title="Ad soyad">AS</abbr>}
          summaryLabel="Ad soyad"
          isRequired={false}
          requiredLabel="gerekli"
          isLabelHidden
        />
        <TextField name="bio" label={<b>Hakkında</b>} />
      </>
    );
    expect(screen.getByRole("textbox", { name: "AS" })).toHaveProperty(
      "required",
      false
    );
    expect(form.getFieldLabel("name")).toBe("Ad soyad");
    expect(form.getFieldLabel("bio")).toBeUndefined();
  });

  test("should follow the form's disabled and read-only states unless told otherwise", () => {
    renderForm(
      {
        schema,
        defaultValues: DEFAULTS,
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <TextField name="name" label="Ad" />
        <TextField
          name="bio"
          label="Hakkında"
          disabled={false}
          readOnly={false}
        />
      </>
    );
    const name = screen.getByRole("textbox", { name: /^Ad/ });
    expect(name).toHaveProperty("disabled", true);
    expect(name).toHaveProperty("readOnly", true);
    const bio = screen.getByRole("textbox", { name: "Hakkında" });
    expect(bio).toHaveProperty("disabled", false);
    expect(bio).toHaveProperty("readOnly", false);
  });

  test("should format with a FieldFormat", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: { ...DEFAULTS, price: 349000 } },
      <TextField name="price" label="Fiyat" format={moneyFormat} suffix="TL" />
    );
    const input = screen.getByRole("textbox", {
      name: /Fiyat/,
    }) as HTMLInputElement;
    expect(input.value).toBe("3.490,00");
    await user.clear(input);
    await user.type(input, "12,5");
    expect(form.getValue("price")).toBe(1250);
    await user.tab();
    expect(input.value).toBe("12,50");
  });

  test("should show a value set from outside", () => {
    const { form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <TextField name="name" label="Ad" />
    );
    act(() => form.setValue("name", "Grace"));
    expect(screen.getByRole("textbox", { name: /Ad/ })).toHaveProperty(
      "value",
      "Grace"
    );
  });
});

describe("NumberField", () => {
  test("should read Turkish numbers with decimals and a minus", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <NumberField name="age" label="Yaş" />
        <NumberField
          name="price"
          label="Fiyat"
          decimals={2}
          allowNegative
          autoComplete="on"
        />
      </>
    );
    const age = screen.getByRole("textbox", { name: /Yaş/ });
    expect(age.getAttribute("inputmode")).toBe("numeric");
    expect(age.getAttribute("autocomplete")).toBe("off");
    await user.type(age, "1234");
    expect(age).toHaveProperty("value", "1.234");
    expect(form.getValue("age")).toBe(1234);

    const price = screen.getByRole("textbox", { name: /Fiyat/ });
    expect(price.getAttribute("inputmode")).toBe("decimal");
    expect(price.getAttribute("autocomplete")).toBe("on");
    await user.type(price, "-1,25");
    expect(form.getValue("price")).toBe(-1.25);
  });
});

describe("TextareaField, PasswordField and DateField", () => {
  test("should bind each native control", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS, formProps: { isReadOnly: true } },
      <>
        <TextareaField name="bio" label="Hakkında" readOnly={false} />
        <PasswordField name="password" label="Şifre" readOnly={false} />
        <DateField name="birthDate" label="Doğum tarihi" readOnly={false} />
      </>
    );
    await user.type(
      screen.getByRole("textbox", { name: "Hakkında" }),
      "Merhaba"
    );
    expect(form.getValue("bio")).toBe("Merhaba");
    const password = screen.getByLabelText(/^Şifre/, { selector: "input" });
    expect(password.getAttribute("type")).toBe("password");
    await user.type(password, "gizli");
    expect(form.getValue("password")).toBe("gizli");
    const date = screen.getByLabelText(/Doğum tarihi/);
    fireEvent.change(date, { target: { value: "1990-12-31" } });
    expect(form.getValue("birthDate")).toBe("1990-12-31");
  });

  test("should follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: DEFAULTS,
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <TextareaField name="bio" label="Hakkında" />
        <PasswordField name="password" label="Şifre" />
        <DateField name="birthDate" label="Doğum tarihi" />
        <TextareaField name="name" label="Ad" disabled={false} />
        <PasswordField name="password" label="Yeni şifre" disabled={false} />
        <DateField name="birthDate" label="Bitiş" disabled={false} />
      </>
    );
    for (const label of [/Hakkında/, /^Şifre/, /Doğum tarihi/]) {
      const control = screen.getByLabelText(label, {
        selector: "input, textarea",
      });
      expect(control).toHaveProperty("disabled", true);
      expect(control).toHaveProperty("readOnly", true);
    }
    for (const label of [/^Ad/, /Yeni şifre/, /Bitiş/]) {
      expect(
        screen.getByLabelText(label, { selector: "input, textarea" })
      ).toHaveProperty("disabled", false);
    }
  });
});

describe("scaled-integer fields", () => {
  const scaled = z.object({
    amount: z.number("Tutar gerekli"),
    rate: z.number().nullable(),
    vat: z.number().nullable(),
    weight: z.number().nullable(),
  });

  test("should write scaled integers, an empty field being null", async () => {
    const { user, form } = renderForm(
      {
        schema: scaled,
        defaultValues: { rate: null, vat: 2000, weight: null },
      },
      <>
        <MoneyField name="amount" label="Tutar" minorDigits={2} currency="TL" />
        <RateField name="rate" label="Kur" />
        <PercentField name="vat" label="KDV" />
        <QuantityInputField
          name="weight"
          label="Ağırlık"
          unitDigits={3}
          unit="kg"
        />
      </>
    );
    const amount = screen.getByRole("textbox", { name: /Tutar/ });
    expect(amount).toHaveProperty("required", true);
    await user.type(amount, "1234,5");
    expect(form.getValue("amount")).toBe(123450);
    await user.clear(amount);
    expect(form.getValue("amount")).toBeNull();

    await user.type(screen.getByRole("textbox", { name: /Kur/ }), "34,5");
    expect(form.getValue("rate")).toBe(34_500_000);
    expect(screen.getByRole("textbox", { name: /KDV/ })).toHaveProperty(
      "value",
      "20"
    );
    await user.type(screen.getByRole("textbox", { name: /Ağırlık/ }), "2,5");
    expect(form.getValue("weight")).toBe(25_000);
  });

  test("should show the schema's error and follow the form's states", async () => {
    const { user } = renderForm(
      {
        schema: scaled,
        defaultValues: { rate: null, vat: null, weight: null },
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <MoneyField
          name="amount"
          label="Tutar"
          minorDigits={2}
          disabled={false}
          readOnly={false}
        />
        <PercentField name="vat" label="KDV" />
        <button type="submit">Kaydet</button>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByRole("alert").textContent).toContain("Tutar gerekli");
    const vat = screen.getByRole("textbox", { name: /KDV/ });
    expect(vat).toHaveProperty("disabled", true);
    expect(vat).toHaveProperty("readOnly", true);
  });
});
