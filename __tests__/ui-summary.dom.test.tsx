import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { useForm } from "../lib/index";
import { ErrorSummary, fieldsOf, SubmitButton, TextField } from "../lib/ui";
import hasLeft from "../lib/ui/has-left";
import { renderForm, silenceRenderErrors, WithUi } from "./fixtures/ui";

const schema = z
  .object({
    name: z.string().min(2, "Ad kısa"),
    email: z.email("E-posta geçersiz"),
    city: z.string(),
  })
  .refine((values) => values.city !== "x", "Kayıt reddedildi");
type Values = z.input<typeof schema>;
const DEFAULTS: Values = { name: "", email: "", city: "" };

describe("ErrorSummary", () => {
  test("should appear after a failed submit with links to the fields", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <ErrorSummary className="summary" />
        <TextField name="name" label="Ad" />
        <TextField name="email" label={<b>E-posta</b>} />
        <SubmitButton />
      </>
    );
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    const summary = screen.getAllByRole("alert")[0] as HTMLElement;
    expect(summary.textContent).toContain("Lütfen işaretli alanları düzeltin.");
    const link = screen.getByRole("link", { name: "Ad: Ad kısa" });
    const nameInput = screen.getByRole("textbox", { name: /^Ad/ });
    expect(link.getAttribute("href")).toBe(`#${nameInput.id}`);
    expect(screen.getByRole("link", { name: "E-posta geçersiz" })).toBeTruthy();

    act(() => form.setError("city", "Şehir sunucuda yok"));
    expect(screen.getByText("Şehir sunucuda yok").closest("a")).toBeNull();
    act(() => form.setFormError("Genel hata"));
    expect(screen.getByText("Genel hata").tagName).toBe("LI");

    await user.click(link);
    expect(document.activeElement).toBe(nameInput);
    expect(document.querySelector(".summary")?.getAttribute("tabindex")).toBe(
      "-1"
    );
  });

  test("should take the focus when no field on screen has the error", async () => {
    const { user } = renderForm(
      { schema, defaultValues: { name: "Ada", email: "a@b.co", city: "x" } },
      <>
        <ErrorSummary title="Gönderilemedi" />
        <SubmitButton>Gönder</SubmitButton>
      </>
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    expect(screen.getByText("Gönderilemedi")).toBeTruthy();
    expect(screen.getByText("Kayıt reddedildi")).toBeTruthy();
    await waitFor(() => {
      expect(document.activeElement?.getAttribute("tabindex")).toBe("-1");
    });
  });

  test("should take its form from the prop and refuse to render without one", async () => {
    const Page = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: DEFAULTS,
        onSubmit: () => {},
      });
      return (
        <WithUi>
          <ErrorSummary form={form} />
          <button type="button" onClick={() => void form.handleSubmit()}>
            Doğrula
          </button>
        </WithUi>
      );
    };
    render(<Page />);
    await userEvent.click(screen.getByRole("button", { name: "Doğrula" }));
    expect(screen.getByText("Ad kısa")).toBeTruthy();

    silenceRenderErrors();
    expect(() => render(<ErrorSummary />)).toThrow(
      "@handijitcom/forms/ui: <ErrorSummary> has no form."
    );
  });
});

describe("SubmitButton", () => {
  test("should be busy while the form submits", async () => {
    let finish = (): void => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { user } = renderForm(
      {
        schema,
        defaultValues: { name: "Ada", email: "a@b.co", city: "" },
        onSubmit,
      },
      <SubmitButton />
    );
    const button = screen.getByRole("button", { name: "Kaydet" });
    await user.click(button);
    await waitFor(() => expect(button.getAttribute("aria-busy")).toBe("true"));
    expect(button).toHaveProperty("disabled", true);
    await act(async () => finish());
    expect(button.getAttribute("aria-busy")).not.toBe("true");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("should follow a disabled form unless told otherwise", () => {
    renderForm(
      { schema, defaultValues: DEFAULTS, formProps: { isDisabled: true } },
      <>
        <SubmitButton>Bir</SubmitButton>
        <SubmitButton disabled={false}>İki</SubmitButton>
      </>
    );
    expect(screen.getByRole("button", { name: "Bir" })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByRole("button", { name: "İki" })).toHaveProperty(
      "disabled",
      false
    );
  });

  test("should take its form from the prop and refuse to render without one", () => {
    const Page = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: DEFAULTS,
        onSubmit: () => {},
      });
      return (
        <WithUi>
          <SubmitButton form={form} />
        </WithUi>
      );
    };
    render(<Page />);
    expect(screen.getByRole("button", { name: "Kaydet" })).toHaveProperty(
      "disabled",
      false
    );

    silenceRenderErrors();
    expect(() => render(<SubmitButton />)).toThrow(
      "@handijitcom/forms/ui: <SubmitButton> has no form."
    );
  });
});

describe("binders without a form", () => {
  test("should name the field that has no form", () => {
    silenceRenderErrors();
    expect(() =>
      render(
        <WithUi>
          <TextField name="email" label="E-posta" />
        </WithUi>
      )
    ).toThrow('@handijitcom/forms/ui: the field "email" has no form.');
  });

  test("should bind to the form prop outside a <Form>", async () => {
    let captured: ReturnType<typeof useForm<typeof schema>> | undefined;
    const Page = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: DEFAULTS,
        onSubmit: () => {},
      });
      captured = form;
      return (
        <WithUi>
          <TextField form={form} name="name" label="Ad" />
        </WithUi>
      );
    };
    render(<Page />);
    await userEvent.type(screen.getByRole("textbox", { name: /Ad/ }), "Ada");
    expect(captured?.getValue("name")).toBe("Ada");
  });
});

describe("fieldsOf", () => {
  test("should render the typed binders of one form", async () => {
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      (current) => {
        const fields = fieldsOf(current);
        return <fields.TextField name="city" label="Şehir" />;
      }
    );
    await user.type(screen.getByRole("textbox", { name: "Şehir" }), "İzmir");
    expect(form.getValue("city")).toBe("İzmir");
  });
});

describe("hasLeft", () => {
  test("should tell a blur out of the element from a move between its parts", () => {
    document.body.innerHTML =
      '<div id="group"><input id="a" /><input id="b" /></div><input id="out" />';
    const group = document.getElementById("group") as HTMLElement;
    const seen: boolean[] = [];
    group.addEventListener("focusout", (event) => {
      seen.push(
        hasLeft({
          relatedTarget: event.relatedTarget,
          currentTarget: group,
        } as unknown as Parameters<typeof hasLeft>[0])
      );
    });
    const [a, b, out] = ["a", "b", "out"].map(
      (id) => document.getElementById(id) as HTMLElement
    );
    fireEvent.focusOut(a as HTMLElement, { relatedTarget: b });
    fireEvent.focusOut(b as HTMLElement, { relatedTarget: out });
    fireEvent.focusOut(b as HTMLElement, { relatedTarget: null });
    expect(seen).toEqual([false, true, true]);
    document.body.innerHTML = "";
  });
});
