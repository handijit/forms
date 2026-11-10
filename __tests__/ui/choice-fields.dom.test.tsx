import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
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
} from "../../lib/ui";
import { expectNoAxeViolations } from "../support/axe";
import { stubMatchMedia } from "../support/match-media";
import { nextFrame } from "../support/next-frame";
import { renderForm } from "../support/render-form";

const schema = z.object({
  city: z.enum(["ist", "ank"], { error: "Şehir seçin" }),
  district: z.string({ error: "İlçe seçin" }),
  terms: z.literal(true, { error: "Koşulları kabul edin" }),
  newsletter: z.boolean(),
  plan: z.enum(["free", "pro"], { error: "Plan seçin" }),
  shipping: z.enum(["std", "fast"], { error: "Gönderim seçin" }),
  view: z.enum(["list", "grid"]),
  size: z.string({ error: "Beden seçin" }),
  colors: z.array(z.string()).min(1, "Renk seçin"),
});

type Values = z.input<typeof schema>;

const defaults = {
  newsletter: false,
  view: "list",
  colors: [],
} as unknown as Values;

const CITIES = [
  { value: "ist", label: "İstanbul" },
  { value: "ank", label: "Ankara" },
];

const fields = (
  <>
    <SelectField name="city" label="Şehir" options={CITIES} />
    <ComboboxField
      name="district"
      label="İlçe"
      options={[
        { value: "kadikoy", label: "Kadıköy" },
        { value: "besiktas", label: "Beşiktaş" },
      ]}
      labels={{ placeholder: "İlçe arayın" }}
      isClearable
    />
    <CheckboxField
      name="terms"
      label="Koşulları kabul ediyorum"
      hint="Okuyun"
    />
    <SwitchField name="newsletter" label="Bülten" />
    <RadioGroupField
      name="plan"
      label="Plan"
      hint="Sonra değiştirebilirsiniz"
      options={[
        { value: "free", label: "Ücretsiz", hint: "Temel" },
        { value: "pro", label: "Pro", count: 3, isDisabled: false },
      ]}
      groupClassName="plans"
    />
    <RadioCardGroupField
      name="shipping"
      label="Gönderim"
      options={[
        { value: "std", children: "Standart" },
        { value: "fast", children: "Hızlı", isDisabled: false },
      ]}
    />
    <SegmentedField
      name="view"
      label="Görünüm"
      options={[
        { value: "list", label: "Liste" },
        { value: "grid", label: "Izgara" },
      ]}
    />
    <ChipGroupField
      name="size"
      label="Beden"
      options={[
        { value: "s", label: "S" },
        { value: "m", label: "M" },
      ]}
    />
    <ChipGroupField
      name="colors"
      label="Renkler"
      isMultiple
      options={[
        { value: "red", label: "Kırmızı" },
        { value: "blue", label: "Mavi" },
      ]}
    />
  </>
);

beforeEach(() => {
  stubMatchMedia();
});

describe("the choice binders", () => {
  test("should render accessibly before and after a failed submit", async () => {
    const user = userEvent.setup();
    const { container, onSubmit } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    await expectNoAxeViolations(container);
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    await nextFrame();
    expect(onSubmit).not.toHaveBeenCalled();
    for (const message of [
      "Şehir seçin",
      "İlçe seçin",
      "Koşulları kabul edin",
      "Plan seçin",
      "Gönderim seçin",
      "Beden seçin",
      "Renk seçin",
    ]) {
      expect(screen.getByText(message)).toBeTruthy();
    }
    const city = screen.getByRole("combobox", { name: /Şehir/ });
    expect(city.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(city);
    const terms = screen.getByRole("checkbox", {
      name: "Koşulları kabul ediyorum",
    });
    expect(terms.getAttribute("aria-invalid")).toBe("true");
    expect(terms.getAttribute("aria-describedby")?.split(" ")).toHaveLength(2);
    const plan = screen.getByRole("radiogroup", { name: "Plan" });
    expect(plan.getAttribute("aria-invalid")).toBe("true");
    expect(plan.getAttribute("aria-required")).toBe("true");
    await expectNoAxeViolations(container);
  });

  test("should write each choice into the form", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    await user.click(screen.getByRole("combobox", { name: /Şehir/ }));
    await user.click(screen.getByRole("option", { name: "Ankara" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Koşulları kabul ediyorum" })
    );
    await user.click(screen.getByRole("switch", { name: "Bülten" }));
    await user.click(screen.getByRole("radio", { name: "Pro 3" }));
    await user.click(screen.getByText("Hızlı"));
    await user.click(screen.getByRole("radio", { name: "Izgara" }));
    await user.click(screen.getByRole("radio", { name: "M" }));
    await user.click(screen.getByRole("button", { name: "Kırmızı" }));
    expect(form().getValues()).toMatchObject({
      city: "ank",
      terms: true,
      newsletter: true,
      plan: "pro",
      shipping: "fast",
      view: "grid",
      size: "m",
      colors: ["red"],
    });
    expect(form().getState().touched.city).toBe(true);
  });

  test("should choose and clear in the combobox", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    const combobox = screen.getByRole("combobox", { name: /İlçe/ });
    await user.click(combobox);
    await user.click(screen.getByRole("option", { name: /Kadıköy/ }));
    expect(form().getValue("district")).toBe("kadikoy");
    await user.click(screen.getByRole("button", { name: "Temizle" }));
    expect(form().getValue("district")).toBeNull();
  });

  test("should mark a radio group touched when focus leaves it", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    const plan = screen.getByRole("radiogroup", { name: "Plan" });
    await user.click(within(plan).getByRole("radio", { name: "Ücretsiz" }));
    expect(form().getState().touched.plan).toBeUndefined();
    await user.click(document.body);
    expect(form().getState().touched.plan).toBe(true);
  });

  test("should disable the choices from the form", () => {
    renderForm({
      schema,
      defaultValues: defaults,
      isReadOnly: true,
      children: fields,
    });
    expect(
      screen.getByRole("combobox", { name: /Şehir/ }).hasAttribute("disabled")
    ).toBe(true);
    expect(
      screen
        .getByRole("checkbox", { name: "Koşulları kabul ediyorum" })
        .hasAttribute("disabled")
    ).toBe(true);
    expect(
      screen.getByRole("radio", { name: "Pro 3" }).hasAttribute("disabled")
    ).toBe(true);
  });
});
