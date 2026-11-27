import { act, screen } from "@testing-library/react";
import axe from "axe-core";
import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  CheckboxField,
  ChipGroupField,
  ComboboxField,
  DateField,
  DateRangeField,
  ErrorSummary,
  FileUploadField,
  MoneyField,
  NumberField,
  PasswordField,
  PercentField,
  QuantityField,
  QuantityInputField,
  RadioCardGroupField,
  RadioGroupField,
  RangeSliderField,
  RateField,
  RatingField,
  SegmentedField,
  SelectField,
  SubmitButton,
  SwitchField,
  TagInputField,
  TextareaField,
  TextField,
} from "../lib/ui";
import { renderForm } from "./fixtures/ui";

const OPTIONS = [
  { value: "a", label: "Birinci" },
  { value: "b", label: "İkinci" },
];

const required = z.string().min(1, "Gerekli");
const schema = z.object({
  text: required,
  number: z.number("Gerekli"),
  textarea: required,
  password: required,
  select: required,
  combobox: required,
  checkbox: z.literal(true, { error: "Gerekli" }),
  switch: z.literal(true, { error: "Gerekli" }),
  radio: required,
  card: required,
  date: required,
  range: z.object({ start: required, end: required }),
  quantity: z.number().min(5, "En az 5"),
  segment: z.string().refine((value) => value !== "a", "Gerekli"),
  chips: z.string("Gerekli"),
  slider: z
    .tuple([z.number(), z.number()])
    .refine(([low]) => low > 0, "Gerekli"),
  rating: z.number("Gerekli"),
  tags: z.array(z.string()).min(1, "Gerekli"),
  files: z.array(z.instanceof(File)).min(1, "Gerekli"),
  money: z.number("Gerekli"),
  percent: z.number("Gerekli"),
  rate: z.number("Gerekli"),
  weight: z.number("Gerekli"),
});

// jsdom has no layout: contrast and landmark rules belong to the application's own checks.
const violationsOf = async (container: HTMLElement): Promise<string[]> => {
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
      region: { enabled: false },
    },
  });
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`
  );
};

const Fields = (): ReactElement => (
  <>
    <ErrorSummary />
    <TextField name="text" label="Metin" hint="Açıklama" />
    <NumberField name="number" label="Sayı" />
    <TextareaField name="textarea" label="Uzun metin" />
    <PasswordField name="password" label="Şifre" />
    <SelectField name="select" label="Seçim" options={OPTIONS} />
    <ComboboxField
      name="combobox"
      label="Arama"
      options={OPTIONS}
      labels={{ placeholder: "Seçin" }}
    />
    <CheckboxField name="checkbox" label="Onay" />
    <SwitchField name="switch" label="Anahtar" />
    <RadioGroupField name="radio" label="Radyo" options={OPTIONS} />
    <RadioCardGroupField
      name="card"
      label="Kart"
      options={OPTIONS.map(({ value, label }) => ({ value, children: label }))}
    />
    <DateField name="date" label="Tarih" />
    <DateRangeField
      name="range"
      label="Aralık"
      startLabel="Başlangıç"
      endLabel="Bitiş"
    />
    <QuantityField name="quantity" label="Adet" />
    <SegmentedField name="segment" label="Bölüm" options={OPTIONS} />
    <ChipGroupField name="chips" label="Çipler" options={OPTIONS} />
    <RangeSliderField name="slider" label="Aralık değeri" min={0} max={10} />
    <RatingField name="rating" label="Puan" />
    <TagInputField name="tags" label="Etiketler" removeLabel="Kaldır" />
    <FileUploadField
      name="files"
      label="Dosyalar"
      removeLabel="Kaldır"
      dropLabel="Bırakın"
    />
    <MoneyField name="money" label="Tutar" minorDigits={2} currency="TL" />
    <PercentField name="percent" label="Oran" />
    <RateField name="rate" label="Kur" />
    <QuantityInputField
      name="weight"
      label="Ağırlık"
      unitDigits={3}
      unit="kg"
    />
    <SubmitButton />
  </>
);

describe("accessibility", () => {
  test("should have no axe violations before and after a failed submit", async () => {
    const { container, user } = renderForm(
      {
        schema,
        defaultValues: {
          quantity: 1,
          segment: "a",
          slider: [0, 10],
          tags: [],
          files: [],
        },
      },
      <Fields />
    );
    expect(await violationsOf(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(20);
    expect(await violationsOf(container)).toEqual([]);
  });

  test("should have no axe violations in a read-only form", async () => {
    const { container, form } = renderForm(
      {
        schema,
        defaultValues: { tags: ["a"] },
        formProps: { isReadOnly: true },
      },
      <Fields />
    );
    await act(() => form.validate());
    expect(await violationsOf(container)).toEqual([]);
  });
});
