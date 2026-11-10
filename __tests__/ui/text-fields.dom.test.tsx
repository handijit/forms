import { render, screen } from "@testing-library/react";
import { UiProvider } from "@handijit/ui";
import type { ReactElement } from "react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  fieldsOf,
  NumberField,
  PasswordField,
  TextareaField,
  TextField,
} from "../../lib/ui";
import { Form, useForm } from "../../lib/index";
import { expectNoAxeViolations } from "../support/axe";
import { nextFrame } from "../support/next-frame";
import { LABELS, renderForm } from "../support/render-form";
import { silenceRenderErrors } from "../support/silence-render-errors";

const schema = z.object({
  email: z.email("Geçerli bir e-posta girin"),
  nickname: z.string().optional(),
  bio: z.string().max(10, "En fazla 10 harf"),
  password: z.string().min(6, "En az 6 karakter"),
  age: z.number({ error: "Yaşınızı girin" }).min(18, "En az 18"),
  price: z.number().optional(),
});

const defaults = {
  email: "",
  bio: "",
  password: "",
  age: undefined as unknown as number,
};

const fields = (
  <>
    <TextField name="email" label="E-posta" hint="İş adresiniz" type="email" />
    <TextField name="nickname" label="Takma ad" />
    <TextareaField name="bio" label="Hakkında" />
    <PasswordField name="password" label="Şifre" />
    <NumberField name="age" label="Yaş" />
    <NumberField name="price" label="Fiyat" decimals={2} />
  </>
);

describe("the text binders", () => {
  test("should render ui fields with labels, hints and the required mark", async () => {
    const { container } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    const email = screen.getByLabelText(/E-posta/);
    expect(email.getAttribute("required")).not.toBeNull();
    expect(screen.getByText("İş adresiniz").id).toBe(
      email.getAttribute("aria-describedby")
    );
    expect(
      screen.getByLabelText("Takma ad").getAttribute("required")
    ).toBeNull();
    expect(screen.getByLabelText(/Yaş/).getAttribute("inputmode")).toBe(
      "numeric"
    );
    expect(screen.getByLabelText("Fiyat").getAttribute("inputmode")).toBe(
      "decimal"
    );
    await expectNoAxeViolations(container);
  });

  test("should write what the user types into the form", async () => {
    const user = userEvent.setup();
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    await user.type(screen.getByLabelText(/E-posta/), "ada@example.com");
    await user.type(screen.getByLabelText(/Hakkında/), "Merhaba");
    await user.type(
      screen.getByLabelText(/Şifre/, { selector: "input" }),
      "gizlisifre"
    );
    await user.type(screen.getByLabelText(/Yaş/), "1234");
    await user.type(screen.getByLabelText("Fiyat"), "12,50");
    expect(form().getValues()).toEqual({
      email: "ada@example.com",
      bio: "Merhaba",
      password: "gizlisifre",
      age: 1234,
      price: 12.5,
    });
    expect((screen.getByLabelText(/Yaş/) as HTMLInputElement).value).toBe(
      "1.234"
    );
  });

  test("should show errors through ui's Field after a submit and focus the first", async () => {
    const user = userEvent.setup();
    const { container } = renderForm({
      schema,
      defaultValues: defaults,
      children: fields,
    });
    await user.type(screen.getByLabelText(/Hakkında/), "çok uzun bir metin");
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    await nextFrame();
    const email = screen.getByLabelText(/E-posta/);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const describedBy =
      email.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toHaveLength(2);
    expect(document.getElementById(describedBy[0] ?? "")?.textContent).toBe(
      "Geçerli bir e-posta girin"
    );
    expect(document.activeElement).toBe(email);
    expect(screen.getByText("En fazla 10 harf")).toBeTruthy();
    expect(screen.getByText("Yaşınızı girin")).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  test("should disable or freeze every field from the form", () => {
    renderForm({
      schema,
      defaultValues: defaults,
      isDisabled: true,
      children: fields,
    });
    expect(screen.getByLabelText(/E-posta/).hasAttribute("disabled")).toBe(
      true
    );
    expect(screen.getByLabelText(/Hakkında/).hasAttribute("disabled")).toBe(
      true
    );
  });

  test("should make every field read-only from the form, and let a field override it", () => {
    renderForm({
      schema,
      defaultValues: defaults,
      isReadOnly: true,
      children: (
        <>
          <TextField name="email" label="E-posta" />
          <TextareaField
            name="bio"
            label="Hakkında"
            readOnly={false}
            disabled
          />
        </>
      ),
    });
    expect(screen.getByLabelText(/E-posta/).hasAttribute("readonly")).toBe(
      true
    );
    expect(screen.getByLabelText(/Hakkında/).hasAttribute("readonly")).toBe(
      false
    );
    expect(screen.getByLabelText(/Hakkında/).hasAttribute("disabled")).toBe(
      true
    );
  });

  test("should run a field's own validator, outside a <Form> with the form prop", async () => {
    const user = userEvent.setup();
    const validate = vi.fn(async (value: string) =>
      value === "ada@example.com" ? "Bu e-posta kayıtlı" : undefined
    );
    const Host = (): ReactElement => {
      const form = useForm({
        schema: z.object({ email: z.email() }),
        defaultValues: { email: "" },
        onSubmit: vi.fn(),
        mode: "blur",
      });
      return (
        <UiProvider labels={LABELS}>
          <TextField
            form={form}
            name="email"
            label="E-posta"
            validate={validate}
          />
          <button type="button">Sonraki</button>
        </UiProvider>
      );
    };
    render(<Host />);
    await user.type(screen.getByLabelText(/E-posta/), "ada@example.com");
    await user.tab();
    expect(await screen.findByText("Bu e-posta kayıtlı")).toBeTruthy();
    expect(validate).toHaveBeenCalledWith(
      "ada@example.com",
      expect.any(Object)
    );
  });

  test("should type names through fieldsOf and render the same binders", async () => {
    const user = userEvent.setup();
    const Host = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: defaults,
        onSubmit: vi.fn(),
      });
      const f = fieldsOf(form);
      return (
        <UiProvider labels={LABELS}>
          <Form form={form}>
            <f.TextField name="email" label="E-posta" />
          </Form>
        </UiProvider>
      );
    };
    render(<Host />);
    await user.type(screen.getByLabelText(/E-posta/), "a");
    expect((screen.getByLabelText(/E-posta/) as HTMLInputElement).value).toBe(
      "a"
    );
  });

  test("should explain a binder rendered without a form", () => {
    silenceRenderErrors();
    expect(() => render(<TextField name="email" label="E-posta" />)).toThrow(
      'the field "email" has no form'
    );
  });
});
