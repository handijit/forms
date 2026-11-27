import { act, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  CheckboxField,
  ChipGroupField,
  ComboboxField,
  RadioCardGroupField,
  RadioGroupField,
  SegmentedField,
  SelectField,
  SwitchField,
} from "../lib/ui";
import { renderForm } from "./fixtures/ui";

const OPTIONS = [
  { value: "tr", label: "Türkiye" },
  { value: "de", label: "Almanya" },
];
const COMBOBOX_LABELS = { placeholder: "Ülke seçin", searchPlaceholder: "Ara" };

const schema = z.object({
  country: z.string("Ülke seçin").min(1, "Ülke seçin"),
  city: z.string().nullable(),
  terms: z.literal(true, { error: "Koşulları kabul edin" }),
  news: z.boolean(),
  plan: z.string().min(1, "Plan seçin"),
  view: z.string(),
  tag: z.string().nullable(),
  tags: z.array(z.string()),
});
type Values = z.input<typeof schema>;
const DEFAULTS: Partial<Values> = {
  city: null,
  news: false,
  plan: "",
  view: "list",
  tag: null,
  tags: [],
};

describe("SelectField", () => {
  test("should choose a value, blur when focus leaves and show its error", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS, mode: "blur" },
      <>
        <SelectField
          name="country"
          label="Ülke"
          options={OPTIONS}
          hint="Fatura ülkesi"
        />
        <button type="button">Sonraki</button>
      </>
    );
    const trigger = screen.getByRole("combobox", { name: /Ülke/ });
    act(() => trigger.focus());
    await user.tab();
    expect(form.getState().touched.country).toBe(true);
    expect(screen.getByRole("alert").textContent).toContain("Ülke seçin");
    expect(trigger.getAttribute("aria-invalid")).toBe("true");
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Almanya" }));
    expect(form.getValue("country")).toBe("de");
    expect(form.getFieldLabel("country")).toBe("Ülke");
  });

  test("should follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: { ...DEFAULTS, country: "tr" },
        formProps: { isReadOnly: true, isDisabled: true },
      },
      <>
        <SelectField name="country" label="Ülke" options={OPTIONS} />
        <SelectField
          name="view"
          label="Görünüm"
          options={OPTIONS}
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    const country = screen.getByRole("combobox", { name: /^Ülke/ });
    expect(country).toHaveProperty("disabled", true);
    const view = screen.getByRole("combobox", { name: /Görünüm/ });
    expect(view).toHaveProperty("disabled", false);
    expect(view.getAttribute("aria-readonly")).toBeNull();
  });
});

describe("ComboboxField", () => {
  test("should choose, clear to null and take a rich label", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: { ...DEFAULTS, city: "tr" } },
      <ComboboxField
        name="city"
        label={<span>Şehir</span>}
        summaryLabel="Şehir"
        options={OPTIONS}
        labels={{ ...COMBOBOX_LABELS, clearLabel: "Temizle" }}
        isClearable
      />
    );
    expect(form.getFieldLabel("city")).toBe("Şehir");
    await user.click(screen.getByRole("button", { name: "Temizle" }));
    expect(form.getValue("city")).toBeNull();
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Almanya" }));
    expect(form.getValue("city")).toBe("de");
  });

  test("should follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: DEFAULTS,
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <ComboboxField
          name="city"
          label="Şehir"
          options={OPTIONS}
          labels={COMBOBOX_LABELS}
        />
        <ComboboxField
          name="country"
          label="Ülke"
          options={OPTIONS}
          labels={COMBOBOX_LABELS}
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    const [city, country] = screen.getAllByRole("combobox");
    expect(city).toHaveProperty("disabled", true);
    expect(country).toHaveProperty("disabled", false);
  });
});

describe("CheckboxField and SwitchField", () => {
  test("should write booleans and show the error under the control", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <CheckboxField
          name="terms"
          label="Koşulları kabul ediyorum"
          hint="Okuyun"
        />
        <SwitchField
          name="news"
          label={<b>Bülten</b>}
          summaryLabel="Bülten"
          className="row"
        />
        <button type="submit">Kaydet</button>
      </>
    );
    const checkbox = screen.getByRole("checkbox", { name: /Koşulları/ });
    expect(checkbox).toHaveProperty("required", true);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(checkbox.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toContain(
      "Koşulları kabul edin"
    );
    await user.click(checkbox);
    expect(form.getValue("terms")).toBe(true);
    expect(checkbox.getAttribute("aria-invalid")).toBeNull();
    const toggle = screen.getByRole("switch", { name: "Bülten" });
    expect(toggle).toHaveProperty("required", false);
    await user.click(toggle);
    expect(form.getValue("news")).toBe(true);
    await user.tab();
    expect(form.getState().touched.news).toBe(true);
    expect(form.getFieldLabel("news")).toBe("Bülten");
  });

  test("should be disabled in a read-only form unless told otherwise", () => {
    renderForm(
      { schema, defaultValues: DEFAULTS, formProps: { isReadOnly: true } },
      <>
        <CheckboxField name="terms" label="Koşullar" isRequired={false} />
        <SwitchField name="news" label="Bülten" disabled={false} />
      </>
    );
    expect(screen.getByRole("checkbox", { name: "Koşullar" })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByRole("checkbox", { name: "Koşullar" })).toHaveProperty(
      "required",
      false
    );
    expect(screen.getByRole("switch", { name: "Bülten" })).toHaveProperty(
      "disabled",
      false
    );
  });
});

describe("RadioGroupField and RadioCardGroupField", () => {
  const plans = [
    { value: "basic", label: "Temel", hint: "Tek kullanıcı", count: 3 },
    { value: "pro", label: "Pro", isDisabled: true },
    { value: "team", label: "Ekip" },
  ];

  test("should group the radios, link the error to the group and blur when focus leaves it", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS, mode: "blur" },
      <>
        <RadioGroupField
          name="plan"
          label="Plan"
          options={plans}
          groupClassName="plans"
        />
        <button type="button">Sonraki</button>
      </>
    );
    const group = screen.getByRole("radiogroup", { name: "Plan" });
    expect(group.className).toBe("plans");
    expect(group.getAttribute("aria-required")).toBe("true");
    expect(within(group).getByRole("radio", { name: /Pro/ })).toHaveProperty(
      "disabled",
      true
    );
    await user.click(within(group).getByRole("radio", { name: /Temel/ }));
    expect(form.getValue("plan")).toBe("basic");
    await user.click(within(group).getByRole("radio", { name: /Ekip/ }));
    expect(form.getState().touched.plan).toBeUndefined();
    await user.click(screen.getByRole("button", { name: "Sonraki" }));
    expect(form.getState().touched.plan).toBe(true);
    act(() => form.setError("plan", "Bu plan dolu"));
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(group.getAttribute("aria-describedby")).toBe(`${group.id}-error`);
  });

  test("should choose a card", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <RadioCardGroupField
        name="plan"
        label="Plan"
        groupClassName="cards"
        options={[
          { value: "basic", children: "Temel paket" },
          { value: "pro", children: "Pro paket", isDisabled: true },
        ]}
      />
    );
    const group = screen.getByRole("radiogroup", { name: "Plan" });
    expect(group.className).toBe("cards");
    expect(screen.getByRole("radio", { name: "Pro paket" })).toHaveProperty(
      "disabled",
      true
    );
    await user.click(screen.getByRole("radio", { name: "Temel paket" }));
    expect(form.getValue("plan")).toBe("basic");
    expect(screen.getByRole("radio", { name: "Temel paket" })).toHaveProperty(
      "checked",
      true
    );
  });

  test("should disable the radios in a disabled or read-only form unless told otherwise", () => {
    renderForm(
      { schema, defaultValues: DEFAULTS, formProps: { isReadOnly: true } },
      <>
        <RadioGroupField name="plan" label="Plan" options={plans.slice(0, 1)} />
        <RadioCardGroupField
          name="view"
          label="Görünüm"
          options={[{ value: "list", children: "Liste" }]}
        />
        <RadioGroupField
          name="tag"
          label="Etiket"
          options={[{ value: "a", label: "A" }]}
          isDisabled={false}
        />
        <RadioCardGroupField
          name="city"
          label="Şehir"
          options={[{ value: "x", children: "X" }]}
          isDisabled={false}
        />
      </>
    );
    expect(screen.getByRole("radio", { name: /Temel/ })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByRole("radio", { name: "Liste" })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByRole("radio", { name: "A" })).toHaveProperty(
      "disabled",
      false
    );
    expect(screen.getByRole("radio", { name: "X" })).toHaveProperty(
      "disabled",
      false
    );
  });
});

describe("SegmentedField", () => {
  test("should choose a segment and follow the form's states", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <SegmentedField
          name="view"
          label="Görünüm"
          options={[
            { value: "list", label: "Liste" },
            { value: "grid", label: "Izgara" },
          ]}
        />
        <SegmentedField
          name="plan"
          label="Plan"
          options={[{ value: "a", label: "A" }]}
        />
      </>
    );
    await user.click(screen.getByRole("radio", { name: "Izgara" }));
    expect(form.getValue("view")).toBe("grid");
    expect(
      screen.getByRole("radio", { name: "A" }).getAttribute("aria-checked")
    ).toBe("false");
  });

  test("should be read-only in a read-only form unless told otherwise", () => {
    renderForm(
      { schema, defaultValues: DEFAULTS, formProps: { isReadOnly: true } },
      <>
        <SegmentedField
          name="view"
          label="Görünüm"
          options={[{ value: "list", label: "Liste" }]}
        />
        <SegmentedField
          name="plan"
          label="Plan"
          options={[{ value: "a", label: "A" }]}
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    expect(
      screen
        .getByRole("radiogroup", { name: "Görünüm" })
        .getAttribute("aria-readonly")
    ).toBe("true");
    expect(
      screen
        .getByRole("radiogroup", { name: "Plan" })
        .getAttribute("aria-readonly")
    ).toBeNull();
  });
});

describe("ChipGroupField", () => {
  test("should hold one chip or several", async () => {
    const { user, form } = renderForm(
      {
        schema,
        defaultValues: {
          ...DEFAULTS,
          tag: "x" as unknown as string,
          tags: undefined,
        },
      },
      <>
        <ChipGroupField name="tag" label="Etiket" options={OPTIONS} />
        <ChipGroupField
          name="tags"
          label="Etiketler"
          options={OPTIONS}
          isMultiple
        />
      </>
    );
    const single = screen.getByRole("radiogroup", { name: "Etiket" });
    await user.click(within(single).getByRole("radio", { name: "Türkiye" }));
    expect(form.getValue("tag")).toBe("tr");
    await user.click(within(single).getByRole("radio", { name: "Türkiye" }));
    expect(form.getValue("tag")).toBeNull();

    const multiple = screen.getByRole("group", { name: "Etiketler" });
    await user.click(within(multiple).getByRole("button", { name: "Türkiye" }));
    await user.click(within(multiple).getByRole("button", { name: "Almanya" }));
    expect(form.getValue("tags")).toEqual(["tr", "de"]);
  });

  test("should show a non-string value as no choice and follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: { ...DEFAULTS, tag: 5 as unknown as string },
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <ChipGroupField name="tag" label="Etiket" options={OPTIONS} />
        <ChipGroupField
          name="tags"
          label="Etiketler"
          options={OPTIONS}
          isMultiple
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    const single = screen.getByRole("radiogroup", { name: "Etiket" });
    for (const chip of within(single).getAllByRole("radio")) {
      expect(chip.getAttribute("aria-checked")).toBe("false");
      expect(chip).toHaveProperty("disabled", true);
    }
    const multiple = screen.getByRole("group", { name: "Etiketler" });
    expect(within(multiple).getAllByRole("button")[0]).toHaveProperty(
      "disabled",
      false
    );
  });
});
