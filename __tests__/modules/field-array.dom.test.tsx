import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  Form,
  useField,
  useFieldArray,
  useForm,
  useFormContext,
} from "../../lib/index";
import { nextFrame } from "../support/next-frame";

const schema = z.object({
  items: z
    .array(z.object({ title: z.string().min(1, "Başlık gerekli") }))
    .min(1, "En az bir satır ekleyin"),
});
type Values = z.input<typeof schema>;

const Row = ({
  name,
  label,
}: {
  name: `items.${number}.title`;
  label: string;
}) => {
  const form = useFormContext<Values>();
  const field = useField(form, name, { label });
  return (
    <div>
      <label htmlFor={field.id}>{label}</label>
      <input {...field.inputProps} />
      {field.error === undefined ? null : (
        <p id={field.errorId}>{field.error}</p>
      )}
    </div>
  );
};

const Items = (): ReactElement => {
  const form = useFormContext<Values>();
  const { rows, error, append, remove, move } = useFieldArray(form, "items");
  return (
    <section>
      {error === undefined ? null : <p role="alert">{error}</p>}
      <ul>
        {rows.map((row) => (
          <li key={row.key} data-testid={`row-${row.index}`}>
            <Row name={`${row.name}.title`} label={`Başlık ${row.index + 1}`} />
            <button type="button" onClick={() => remove(row.index)}>
              Sil {row.index + 1}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => append({ title: "" })}>
        Satır ekle
      </button>
      <button type="button" onClick={() => move(0, rows.length - 1)}>
        İlki sona
      </button>
    </section>
  );
};

const Host = ({
  onSubmit = vi.fn(),
}: {
  onSubmit?: () => void;
}): ReactElement => {
  const form = useForm({ schema, defaultValues: { items: [] }, onSubmit });
  return (
    <Form form={form}>
      <Items />
      <button type="submit">Kaydet</button>
    </Form>
  );
};

describe("useFieldArray", () => {
  test("should show the array's own error and accept rows", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Host onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByRole("alert").textContent).toBe(
      "En az bir satır ekleyin"
    );
    await user.click(screen.getByRole("button", { name: "Satır ekle" }));
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    expect(document.activeElement).toBe(screen.getByLabelText("Başlık 1"));
    await user.type(screen.getByLabelText("Başlık 1"), "Kalem");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(onSubmit).toHaveBeenCalledWith(
      { items: [{ title: "Kalem" }] },
      expect.any(Object)
    );
  });

  test("should keep each row's input (and its text) when rows move or go", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Satır ekle" }));
    await user.click(screen.getByRole("button", { name: "Satır ekle" }));
    await user.click(screen.getByRole("button", { name: "Satır ekle" }));
    await user.type(screen.getByLabelText("Başlık 1"), "a");
    await user.type(screen.getByLabelText("Başlık 2"), "b");
    await user.type(screen.getByLabelText("Başlık 3"), "c");
    const firstInput = screen.getByLabelText("Başlık 1");
    await user.click(screen.getByRole("button", { name: "İlki sona" }));
    expect(within(screen.getByTestId("row-2")).getByRole("textbox")).toBe(
      firstInput
    );
    await user.click(screen.getByRole("button", { name: "Sil 1" }));
    expect(
      screen
        .getAllByRole("textbox")
        .map((input) => (input as HTMLInputElement).value)
    ).toEqual(["c", "a"]);
  });
});
