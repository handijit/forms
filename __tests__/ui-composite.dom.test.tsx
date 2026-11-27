import { act, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { z } from "zod";

import {
  DateRangeField,
  FileUploadField,
  QuantityField,
  RangeSliderField,
  RatingField,
  TagInputField,
} from "../lib/ui";
import { renderForm } from "./fixtures/ui";

const schema = z.object({
  period: z
    .object({ start: z.string(), end: z.string() })
    .refine((range) => range.start <= range.end, {
      message: "Bitiş başlangıçtan önce",
      path: ["end"],
    }),
  quantity: z.number().min(2, "En az 2"),
  price: z.tuple([z.number(), z.number()]),
  rating: z.number("Puan verin"),
  tags: z.array(z.string()).min(1, "Bir etiket ekleyin"),
  files: z.array(z.instanceof(File)).min(1, "Dosya ekleyin"),
});
type Values = z.input<typeof schema>;
const DEFAULTS: Partial<Values> = {};

const file = (name: string): File =>
  new File(["x"], name, { type: "text/plain" });

describe("DateRangeField", () => {
  test("should write the range and show an error of either end under it", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <DateRangeField
          name="period"
          label="Dönem"
          startLabel="Başlangıç"
          endLabel="Bitiş"
        />
        <button type="submit">Kaydet</button>
      </>
    );
    const start = screen.getByLabelText("Başlangıç");
    const end = screen.getByLabelText("Bitiş");
    expect(start).toHaveProperty("value", "");
    fireEvent.change(start, { target: { value: "2026-12-31" } });
    expect(form.getValue("period")).toEqual({ start: "2026-12-31", end: "" });
    fireEvent.change(end, { target: { value: "2026-01-01" } });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Bitiş başlangıçtan önce"
    );
    expect(start.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("group", { name: "Dönem" })).toBeTruthy();
  });

  test("should be left only when focus leaves both dates", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: { period: { start: "", end: "" } } },
      <>
        <DateRangeField
          name="period"
          label="Dönem"
          startLabel="Başlangıç"
          endLabel="Bitiş"
        />
        <button type="button">Sonraki</button>
      </>
    );
    await user.click(screen.getByLabelText("Başlangıç"));
    await user.click(screen.getByLabelText("Bitiş"));
    expect(form.getState().touched.period).toBeUndefined();
    await user.click(screen.getByRole("button", { name: "Sonraki" }));
    expect(form.getState().touched.period).toBe(true);
  });

  test("should follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: DEFAULTS,
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <DateRangeField
          name="period"
          label="Dönem"
          startLabel="Başlangıç"
          endLabel="Bitiş"
        />
        <DateRangeField
          name="period"
          label="İkinci dönem"
          startLabel="İlk gün"
          endLabel="Son gün"
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    expect(screen.getByLabelText("Başlangıç")).toHaveProperty("disabled", true);
    expect(screen.getByLabelText("İlk gün")).toHaveProperty("disabled", false);
    expect(screen.getByLabelText("İlk gün")).toHaveProperty("readOnly", false);
  });
});

describe("QuantityField", () => {
  test("should step the number, starting at the minimum or 1", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <QuantityField name="quantity" label="Adet" min={0} />
        <QuantityField name="rating" label="Kişi" />
      </>
    );
    const [first, second] = screen.getAllByRole("spinbutton");
    expect(first).toHaveProperty("value", "0");
    expect(second).toHaveProperty("value", "1");
    const [increase] = screen.getAllByRole("button", { name: "Artır" });
    await user.click(increase as HTMLElement);
    expect(form.getValue("quantity")).toBe(1);
    expect(first?.getAttribute("aria-required")).toBe("true");
  });

  test("should link its error to the number box and follow the form's states", () => {
    const { form } = renderForm(
      {
        schema,
        defaultValues: { quantity: 1 },
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <QuantityField name="quantity" label="Adet" />
        <QuantityField
          name="rating"
          label="Kişi"
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    act(() => form.setError("quantity", "En az 2"));
    const [first, second] = screen.getAllByRole("spinbutton");
    expect(first?.getAttribute("aria-invalid")).toBe("true");
    expect(first?.getAttribute("aria-readonly")).toBe("true");
    expect(second?.getAttribute("aria-readonly")).toBeNull();
  });
});

describe("RangeSliderField", () => {
  test("should move both thumbs, starting at the ends of the scale", () => {
    const { form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <RangeSliderField name="price" label="Fiyat" min={0} max={100} />
    );
    const [low, high] = screen.getAllByRole("slider");
    expect(low).toHaveProperty("value", "0");
    expect(high).toHaveProperty("value", "100");
    fireEvent.change(low as HTMLElement, { target: { value: "20" } });
    expect(form.getValue("price")).toEqual([20, 100]);
  });

  test("should show a stored range and follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: { price: [10, 90] },
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <RangeSliderField name="price" label="Fiyat" min={0} max={100} />
        <RangeSliderField
          name="price"
          label="Bütçe"
          min={0}
          max={100}
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    const sliders = screen.getAllByRole("slider");
    expect(sliders.map((slider) => (slider as HTMLInputElement).value)).toEqual(
      ["10", "90", "10", "90"]
    );
    expect(sliders[0]).toHaveProperty("disabled", true);
    expect(sliders[2]).toHaveProperty("disabled", false);
  });
});

describe("RatingField", () => {
  test("should rate, with the legend as the visible label and the error below", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <RatingField name="rating" label="Puan" className="stars" />
        <button type="submit">Kaydet</button>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    const group = screen.getByRole("group", { name: "Puan" });
    expect(group.getAttribute("aria-invalid")).toBe("true");
    expect(
      screen
        .getAllByRole("alert")
        .some((alert) => alert.textContent?.includes("Puan verin"))
    ).toBe(true);
    await user.click(within(group).getAllByRole("radio")[3] as HTMLElement);
    expect(form.getValue("rating")).toBe(4);
  });

  test("should follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: { rating: 3 },
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <RatingField name="rating" label="Puan" />
        <RatingField
          name="quantity"
          label="Hız"
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    const first = screen.getByRole("group", { name: "Puan" });
    expect(within(first).getAllByRole("radio")[2]).toHaveProperty(
      "checked",
      true
    );
    expect(first).toHaveProperty("disabled", true);
    expect(screen.getByRole("group", { name: "Hız" })).toHaveProperty(
      "disabled",
      false
    );
  });
});

describe("TagInputField", () => {
  test("should add tags and show the array's error", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: { tags: [] } },
      <>
        <TagInputField name="tags" label="Etiketler" removeLabel="Kaldır" />
        <button type="submit">Kaydet</button>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Bir etiket ekleyin"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Etiketler" }),
      "fren{Enter}"
    );
    expect(form.getValue("tags")).toEqual(["fren"]);
  });

  test("should follow the form's states", () => {
    renderForm(
      {
        schema,
        defaultValues: { tags: ["a"] },
        formProps: { isDisabled: true, isReadOnly: true },
      },
      <>
        <TagInputField name="tags" label="Etiketler" removeLabel="Kaldır" />
        <TagInputField
          name="tags"
          label="Anahtarlar"
          removeLabel="Sil"
          isDisabled={false}
          isReadOnly={false}
        />
      </>
    );
    expect(screen.getByRole("textbox", { name: "Etiketler" })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByRole("textbox", { name: "Anahtarlar" })).toHaveProperty(
      "disabled",
      false
    );
    expect(screen.getByRole("button", { name: /Sil/ })).toBeTruthy();
  });
});

test("TagInputField should show a missing list as no tags", () => {
  renderForm(
    { schema, defaultValues: DEFAULTS },
    <TagInputField name="tags" label="Etiketler" removeLabel="Kaldır" />
  );
  expect(screen.queryByRole("button", { name: /Kaldır/ })).toBeNull();
});

describe("FileUploadField", () => {
  const props = {
    label: "Belgeler",
    removeLabel: "Kaldır",
    dropLabel: "Bırakın",
  };

  test("should add files, remove one and show the error", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: { files: [] } },
      <>
        <FileUploadField name="files" isMultiple {...props} />
        <button type="submit">Kaydet</button>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(
      screen
        .getAllByRole("alert")
        .some((alert) => alert.textContent?.includes("Dosya ekleyin"))
    ).toBe(true);
    const input = screen.getByLabelText(/Belgeler/, { selector: "input" });
    await user.upload(input, [file("a.txt"), file("b.txt")]);
    await user.upload(input, file("c.txt"));
    expect(form.getValue("files")?.map((entry) => entry.name)).toEqual([
      "a.txt",
      "b.txt",
      "c.txt",
    ]);
    await user.click(screen.getByRole("button", { name: /b\.txt.*Kaldır/ }));
    expect(form.getValue("files")?.map((entry) => entry.name)).toEqual([
      "a.txt",
      "c.txt",
    ]);
  });

  test("should replace the one file, carry the field's id and blur when focus leaves", async () => {
    const { user, form, container } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <FileUploadField name="files" {...props} />
        <button type="button">Sonraki</button>
      </>
    );
    const input = screen.getByLabelText(/Belgeler/, { selector: "input" });
    await user.upload(input, file("a.txt"));
    await user.upload(input, file("b.txt"));
    expect(form.getValue("files")?.map((entry) => entry.name)).toEqual([
      "b.txt",
    ]);
    const wrapper = form.getFieldElement("files");
    expect(wrapper?.contains(input)).toBe(true);
    expect(container.querySelector(`[id="${wrapper?.id}"]`)).toBe(wrapper);
    act(() => input.focus());
    await user.click(screen.getByRole("button", { name: "Sonraki" }));
    expect(form.getState().touched.files).toBe(true);
  });

  test("should be disabled in a disabled or read-only form unless told otherwise", () => {
    renderForm(
      { schema, defaultValues: { files: [] }, formProps: { isReadOnly: true } },
      <>
        <FileUploadField name="files" {...props} />
        <FileUploadField
          name="files"
          {...props}
          label="Ekler"
          isDisabled={false}
        />
      </>
    );
    expect(
      screen.getByLabelText(/Belgeler/, { selector: "input" })
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByLabelText(/Ekler/, { selector: "input" })
    ).toHaveProperty("disabled", false);
  });
});
