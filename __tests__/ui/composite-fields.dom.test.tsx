import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import {
  DateField,
  DateRangeField,
  FileUploadField,
  QuantityField,
  RangeSliderField,
  RatingField,
  TagInputField,
} from "../../lib/ui";
import { expectNoAxeViolations } from "../support/axe";
import { stubMatchMedia } from "../support/match-media";
import { nextFrame } from "../support/next-frame";
import { renderForm } from "../support/render-form";

const schema = z.object({
  birthday: z.iso.date({ error: "Doğum tarihinizi girin" }),
  period: z
    .object({
      start: z.string(),
      end: z.string().min(1, "Bitiş tarihini girin"),
    })
    .optional(),
  quantity: z.number().min(2, "En az 2 adet"),
  price: z
    .tuple([z.number(), z.number()])
    .refine(([low, high]) => high - low >= 10, "Aralık en az 10 olmalı"),
  rating: z.number({ error: "Puan verin" }),
  tags: z.array(z.string()).min(1, "En az bir etiket"),
  files: z.array(z.instanceof(File)).min(1, "Bir dosya ekleyin"),
});

type Values = z.input<typeof schema>;

const defaults = {
  birthday: "",
  quantity: 1,
  price: [0, 5],
  tags: [],
  files: [],
} as unknown as Values;

const fields = (
  <>
    <DateField name="birthday" label="Doğum tarihi" />
    <DateRangeField
      name="period"
      label="Dönem"
      startLabel="Başlangıç"
      endLabel="Bitiş"
    />
    <QuantityField name="quantity" label="Adet" />
    <RangeSliderField name="price" label="Fiyat aralığı" min={0} max={100} />
    <RatingField name="rating" label="Puanınız" />
    <TagInputField name="tags" label="Etiketler" removeLabel="Kaldır" />
    <FileUploadField
      name="files"
      label="Belge"
      removeLabel="Kaldır"
      dropLabel="Dosyayı sürükleyin ya da seçin"
      isMultiple
    />
  </>
);

beforeEach(() => {
  stubMatchMedia();
});

describe("the composite binders", () => {
  test("should show every error after a failed submit and stay accessible", async () => {
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
      "Doğum tarihinizi girin",
      "En az 2 adet",
      "Aralık en az 10 olmalı",
      "Puan verin",
      "En az bir etiket",
      "Bir dosya ekleyin",
    ]) {
      expect(screen.getAllByText(message).length).toBeGreaterThan(0);
    }
    expect(document.activeElement).toBe(screen.getByLabelText(/Doğum tarihi/));
    await expectNoAxeViolations(container);
  });

  test("should write dates, ranges, numbers, ratings, tags and files", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    fireEvent.change(screen.getByLabelText(/Doğum tarihi/), {
      target: { value: "1990-05-17" },
    });
    fireEvent.change(screen.getByLabelText("Bitiş"), {
      target: { value: "2026-12-31" },
    });
    await user.click(screen.getByRole("button", { name: "Artır" }));
    fireEvent.change(screen.getByRole("slider", { name: /En çok/ }), {
      target: { value: "100" },
    });
    await user.click(screen.getByLabelText(/4 yıldız/));
    await user.type(screen.getByLabelText(/Etiketler/), "acil{Enter}");
    const file = new File(["x"], "fatura.pdf", { type: "application/pdf" });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await user.upload(input, file);
    expect(form().getValues()).toMatchObject({
      birthday: "1990-05-17",
      period: { start: "", end: "2026-12-31" },
      quantity: 2,
      price: [0, 100],
      rating: 4,
      tags: ["acil"],
      files: [file],
    });
    await user.click(
      screen.getByRole("button", { name: /Kaldır.*fatura|fatura.*Kaldır/ })
    );
    expect(form().getValue("files")).toEqual([]);
  });

  test("should show a nested range error on the range field", async () => {
    const user = userEvent.setup();
    renderForm({
      schema,
      defaultValues: { ...defaults, period: { start: "2026-01-01", end: "" } },
      children: fields,
    });
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    const group = screen.getByRole("group", { name: "Dönem" });
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Bitiş tarihini girin")).toBeTruthy();
  });

  test("should keep one file when not multiple, and disable from the form", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: (
        <FileUploadField
          name="files"
          label="Belge"
          removeLabel="Kaldır"
          dropLabel="Dosya seçin"
        />
      ),
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const first = new File(["a"], "a.pdf");
    const second = new File(["b"], "b.pdf");
    await user.upload(input, first);
    await user.upload(input, second);
    expect(form().getValue("files")).toEqual([second]);
    act(() => form().blur("files"));
  });

  test("should mark composites touched when focus leaves them", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    await user.click(screen.getByRole("button", { name: "Artır" }));
    await user.click(document.body);
    expect(form().getState().touched.quantity).toBe(true);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    input.focus();
    input.blur();
    expect(form().getState().touched.files).toBe(true);
  });

  test("should disable composites from the form", () => {
    renderForm({
      schema,
      defaultValues: defaults,
      isDisabled: true,
      children: fields,
    });
    expect(
      screen.getByRole("button", { name: "Artır" }).hasAttribute("disabled")
    ).toBe(true);
    expect(screen.getByLabelText("Bitiş").hasAttribute("disabled")).toBe(true);
  });
});
