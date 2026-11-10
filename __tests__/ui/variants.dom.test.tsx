import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import {
  CheckboxField,
  ChipGroupField,
  ErrorSummary,
  FileUploadField,
  QuantityField,
  RadioCardGroupField,
  RadioGroupField,
  RangeSliderField,
  RatingField,
  SegmentedField,
  SwitchField,
  TagInputField,
  TextField,
} from "../../lib/ui";
import { stubMatchMedia } from "../support/match-media";
import { nextFrame } from "../support/next-frame";
import { renderForm } from "../support/render-form";

const schema = z.object({
  colors: z.array(z.string()).optional(),
  view: z.string().optional(),
  tags: z.array(z.string()).optional(),
  price: z.array(z.number()).optional(),
  count: z.number().optional(),
  pieces: z.number().optional(),
  files: z.array(z.instanceof(File)).min(1, "Bir dosya ekleyin"),
  plan: z.string().optional(),
  shipping: z.string().optional(),
  rating: z.number().optional(),
  terms: z.literal(true, { error: "Kabul edin" }),
  marketing: z.boolean().optional(),
  email: z.string().optional(),
});

beforeEach(() => {
  stubMatchMedia();
});

describe("binder variants", () => {
  test("should render empty values with each binder's own fallback", () => {
    renderForm({
      schema,
      defaultValues: {} as never,
      children: (
        <>
          <ChipGroupField
            name="colors"
            label="Renkler"
            isMultiple
            options={[{ value: "red", label: "Kırmızı" }]}
          />
          <SegmentedField
            name="view"
            label="Görünüm"
            options={[{ value: "list", label: "Liste" }]}
          />
          <TagInputField name="tags" label="Etiketler" removeLabel="Kaldır" />
          <RangeSliderField name="price" label="Fiyat" min={10} max={90} />
          <QuantityField name="count" label="Adet" min={3} />
          <QuantityField name="pieces" label="Parça" />
          <FileUploadField
            name="files"
            label="Belge"
            removeLabel="Kaldır"
            dropLabel="Seçin"
          />
        </>
      ),
    });
    expect(
      screen
        .getByRole("button", { name: "Kırmızı" })
        .getAttribute("aria-pressed")
    ).toBe("false");
    expect(
      screen.getByRole("slider", { name: /En az/ }).getAttribute("value")
    ).toBe("10");
    expect(
      screen.getByRole("slider", { name: /En çok/ }).getAttribute("value")
    ).toBe("90");
    expect(
      (screen.getByRole("spinbutton", { name: "Adet" }) as HTMLInputElement)
        .value
    ).toBe("3");
    expect(
      (screen.getByRole("spinbutton", { name: "Parça" }) as HTMLInputElement)
        .value
    ).toBe("1");
  });

  test("should pass the frame's options to ui's Field", () => {
    renderForm({
      schema,
      defaultValues: {} as never,
      children: (
        <TextField
          name="email"
          label="E-posta"
          isRequired
          requiredLabel="(gerekli)"
          isLabelHidden
          className="frame"
        />
      ),
    });
    expect(screen.getByText("(gerekli)")).toBeTruthy();
    expect(screen.getByLabelText(/E-posta/).closest(".frame")).not.toBeNull();
  });

  test("should keep a group untouched while focus moves inside it", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: {} as never,
      children: (
        <>
          <RadioGroupField
            name="plan"
            label="Plan"
            options={[
              { value: "a", label: "A" },
              { value: "b", label: "B", isDisabled: true },
              { value: "c", label: "C" },
            ]}
          />
          <RadioCardGroupField
            name="shipping"
            label="Gönderim"
            groupClassName="cards"
            options={[{ value: "std", children: "Standart", isDisabled: true }]}
          />
          <RatingField name="rating" label="Puan" className="rating" />
        </>
      ),
    });
    expect(
      screen.getByRole("radio", { name: "B" }).hasAttribute("disabled")
    ).toBe(true);
    expect(document.querySelector(".cards")).not.toBeNull();
    expect(document.querySelector(".rating")).not.toBeNull();
    await user.click(screen.getByRole("radio", { name: "A" }));
    await user.keyboard("{ArrowDown}");
    expect(form().getState().touched.plan).toBeUndefined();
    expect(form().getValue("plan")).toBe("c");
  });

  test("should label toggles in the summary, or leave them unlabelled for rich labels", async () => {
    const { form } = renderForm({
      schema,
      defaultValues: {} as never,
      children: (
        <>
          <ErrorSummary />
          <CheckboxField
            name="terms"
            label={<span>Koşulları kabul ediyorum</span>}
            summaryLabel="Koşullar"
          />
          <SwitchField
            name="marketing"
            label={<b>Kampanyalar</b>}
            className="switch"
          />
          <FileUploadField
            name="files"
            label="Belge"
            removeLabel="Kaldır"
            dropLabel="Seçin"
          />
        </>
      ),
    });
    await act(async () => {
      await form().handleSubmit();
    });
    await nextFrame();
    expect(
      screen.getByRole("link", { name: "Koşullar: Kabul edin" })
    ).toBeTruthy();
    // The upload's container has no id: its error is listed as text.
    const summary = screen
      .getByText("Lütfen işaretli alanları düzeltin.")
      .closest("div");
    expect(summary?.textContent).toContain("Belge: Invalid input");
    expect(screen.queryByRole("link", { name: /Belge/ })).toBeNull();
    expect(form().getFieldLabel("marketing")).toBeUndefined();
  });
});
