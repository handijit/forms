import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiProvider } from "@handijit/ui";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { useForm } from "../../lib/index";
import {
  CheckboxField,
  ErrorSummary,
  SubmitButton,
  TextField,
} from "../../lib/ui";
import { expectNoAxeViolations } from "../support/axe";
import { nextFrame } from "../support/next-frame";
import { LABELS, renderForm } from "../support/render-form";
import { silenceRenderErrors } from "../support/silence-render-errors";

const schema = z.object({
  email: z.email("Geçerli bir e-posta girin"),
  name: z.string().min(2, "En az 2 harf"),
});

const defaults = { email: "", name: "" };

describe("SubmitButton and ErrorSummary", () => {
  test("should list every error after a failed submit, with links to the fields", async () => {
    const user = userEvent.setup();
    const { container } = renderForm({
      schema,
      defaultValues: defaults,
      children: (
        <>
          <ErrorSummary />
          <TextField name="email" label="E-posta" />
          <TextField name="name" label="Ad" />
          <SubmitButton>Kaydet</SubmitButton>
        </>
      ),
    });
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    const link = screen.getByRole("link", { name: "Ad: En az 2 harf" });
    expect(link.getAttribute("href")).toBe(
      `#${screen.getByLabelText(/^Ad/).id}`
    );
    expect(screen.getByText("Lütfen işaretli alanları düzeltin.")).toBeTruthy();
    await user.click(link);
    expect(document.activeElement).toBe(screen.getByLabelText(/^Ad/));
    await expectNoAxeViolations(container);
  });

  test("should take a rich label, list it by its summary label and link a checkbox by its own error", async () => {
    const user = userEvent.setup();
    const { container } = renderForm({
      schema: schema.extend({
        terms: z.literal(true, { error: "Onaylayın" }),
      }),
      defaultValues: { ...defaults, terms: false as unknown as true },
      children: (
        <>
          <ErrorSummary />
          <TextField
            name="email"
            label={
              <>
                E-posta <abbr title="İş adresi">(iş)</abbr>
              </>
            }
            summaryLabel="E-posta"
          />
          <TextField name="name" label="Ad" />
          <CheckboxField name="terms" label="Koşullar" hint="Okuyun" />
          <SubmitButton>Kaydet</SubmitButton>
        </>
      ),
    });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    expect(
      screen.getByRole("link", { name: /^E-posta: / }).getAttribute("href")
    ).toBe(`#${screen.getByLabelText(/^E-posta/).id}`);
    const terms = screen.getByRole("checkbox", { name: "Koşullar" });
    const link = screen.getByRole("link", { name: "Koşullar: Onaylayın" });
    expect(link.getAttribute("href")).toBe(`#${terms.id}`);
    expect(terms.getAttribute("aria-invalid")).toBe("true");
    expect(
      (terms.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .map((id) => document.getElementById(id)?.textContent)
    ).toEqual(["Onaylayın", "Okuyun"]);
    await user.click(link);
    expect(document.activeElement).toBe(terms);
    await expectNoAxeViolations(container);
  });

  test("should list form-level errors and fields that are not on screen, and take the focus", async () => {
    const user = userEvent.setup();
    const { container } = renderForm({
      schema,
      defaultValues: { email: "a@b.co", name: "Ada" },
      onSubmit: ((
        _values: unknown,
        helpers: { applyServerErrors: (e: object) => void }
      ) =>
        helpers.applyServerErrors({
          status: 400,
          detail: "Vergi numarası geçersiz.",
          fields: ["taxNumber"],
        })) as never,
      children: (
        <>
          <ErrorSummary title="Kaydedilemedi" className="summary" />
          <TextField name="email" label="E-posta" />
          <SubmitButton />
        </>
      ),
    });
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    expect(screen.getByText("Kaydedilemedi")).toBeTruthy();
    expect(screen.getByText("Vergi numarası geçersiz.")).toBeTruthy();
    expect(document.activeElement?.className).toBe("summary");
    await expectNoAxeViolations(container);
  });

  test("should list an error of a field without a label or element as text", async () => {
    const { form } = renderForm({
      schema,
      defaultValues: defaults,
      children: <ErrorSummary />,
    });
    await act(async () => {
      await form().handleSubmit();
    });
    expect(screen.getByText("Geçerli bir e-posta girin")).toBeTruthy();
    expect(screen.queryByRole("link")).toBeNull();
  });

  test("should be busy while submitting and disabled with the form", async () => {
    const user = userEvent.setup();
    let finish = (): void => undefined;
    renderForm({
      schema,
      defaultValues: { email: "a@b.co", name: "Ada" },
      onSubmit: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
      children: <SubmitButton />,
    });
    const button = screen.getByRole("button", { name: "Kaydet" });
    await user.click(button);
    expect(button.getAttribute("aria-busy")).toBe("true");
    await act(async () => finish());
    expect(button.getAttribute("aria-busy")).not.toBe("true");
  });

  test("should honour the form's disabled state", () => {
    renderForm({
      schema,
      defaultValues: defaults,
      isDisabled: true,
      children: <SubmitButton>Kaydet</SubmitButton>,
    });
    expect(
      screen.getByRole("button", { name: "Kaydet" }).hasAttribute("disabled")
    ).toBe(true);
  });

  test("should work with the form prop outside a <Form>", async () => {
    const user = userEvent.setup();
    const Host = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: defaults,
        onSubmit: vi.fn(),
      });
      return (
        <UiProvider labels={LABELS}>
          <form
            onSubmit={(event) => {
              void form.handleSubmit(event);
            }}
          >
            <ErrorSummary form={form} />
            <SubmitButton form={form} />
          </form>
        </UiProvider>
      );
    };
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(screen.getByText("En az 2 harf")).toBeTruthy();
  });

  test("should explain a missing form", () => {
    silenceRenderErrors();
    expect(() => render(<SubmitButton />)).toThrow(
      "<SubmitButton> has no form"
    );
    expect(() => render(<ErrorSummary />)).toThrow(
      "<ErrorSummary> has no form"
    );
  });
});
