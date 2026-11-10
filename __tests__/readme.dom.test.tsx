import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiProvider } from "@handijit/ui";
import { render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { Form, useForm } from "../lib/index";
import {
  CheckboxField,
  ErrorSummary,
  SubmitButton,
  TextField,
} from "../lib/ui";
import { nextFrame } from "./support/next-frame";
import { LABELS } from "./support/render-form";

// The quick start of the README, as written there.
const schema = z.object({
  name: z.string().min(2, "Adınızı yazın"),
  email: z.email("Geçerli bir e-posta adresi yazın"),
  terms: z.literal(true, { error: "Koşulları kabul edin" }),
});

const SignUp = () => {
  const form = useForm({
    schema,
    defaultValues: { name: "", email: "" },
    onSubmit: async (values, { applyServerErrors }) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(values),
      });
      if (!response.ok) applyServerErrors(await response.json());
    },
  });
  return (
    <Form form={form}>
      <ErrorSummary />
      <TextField name="name" label="Ad soyad" />
      <TextField name="email" label="E-posta" type="email" />
      <CheckboxField name="terms" label="Kullanım koşullarını kabul ediyorum" />
      <SubmitButton>Hesap oluştur</SubmitButton>
    </Form>
  );
};

describe("the README quick start", () => {
  test("should validate, submit and show the server's field errors", async () => {
    const user = userEvent.setup();
    const fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        status: 400,
        detail: "Bu e-posta kayıtlı.",
        fields: ["email"],
      }),
    }));
    vi.stubGlobal("fetch", fetch);
    render(
      <UiProvider labels={LABELS}>
        <SignUp />
      </UiProvider>
    );
    await user.click(screen.getByRole("button", { name: "Hesap oluştur" }));
    await nextFrame();
    expect(
      screen.getByRole("link", { name: "Ad soyad: Adınızı yazın" })
    ).toBeTruthy();
    await user.type(screen.getByLabelText(/Ad soyad/), "Ada");
    await user.type(screen.getByLabelText(/E-posta/), "ada@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Hesap oluştur" }));
    await nextFrame();
    expect(fetch).toHaveBeenCalledWith("/api/accounts", {
      method: "POST",
      body: '{"name":"Ada","email":"ada@example.com","terms":true}',
    });
    expect(screen.getByLabelText(/E-posta/).getAttribute("aria-invalid")).toBe(
      "true"
    );
    expect(document.activeElement).toBe(screen.getByLabelText(/E-posta/));
  });
});
