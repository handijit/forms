import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useRef, type ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  Form,
  useErrorSummary,
  useField,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
  type FormApi,
  type FormMode,
} from "../../lib/index";
import { expectNoAxeViolations } from "../support/axe";
import { nextFrame } from "../support/next-frame";
import { silenceRenderErrors } from "../support/silence-render-errors";

const schema = z
  .object({
    email: z.email("Geçerli bir e-posta girin"),
    name: z.string().min(2, "En az 2 harf"),
    password: z.string().min(1, "Şifre gerekli"),
    confirm: z.string(),
    note: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Şifreler eşleşmiyor",
  });

type Values = z.input<typeof schema>;

const renders: Record<string, number> = {};

const TextInput = ({
  name,
  label,
  hint,
}: {
  name: keyof Values;
  label: string;
  hint?: string;
}): ReactElement => {
  const form = useFormContext<Values>();
  const field = useField(form, name, { label, hasHint: hint !== undefined });
  renders[name] = (renders[name] ?? 0) + 1;
  return (
    <div>
      <label htmlFor={field.id}>{label}</label>
      <input {...field.inputProps} />
      {hint === undefined ? null : <p id={field.hintId}>{hint}</p>}
      {field.error === undefined ? null : (
        <p id={field.errorId} role="alert">
          {field.error}
        </p>
      )}
    </div>
  );
};

const Summary = (): ReactElement | null => {
  const form = useFormContext<Values>();
  const summary = useErrorSummary(form);
  if (!summary.isVisible) return null;
  return (
    <div
      ref={(element) => {
        summary.ref.current = element;
      }}
      tabIndex={-1}
      data-testid="summary"
    >
      {summary.formErrors.map((message) => (
        <p key={message}>{message}</p>
      ))}
      {summary.items.map((item) => (
        <a
          key={item.name}
          href={item.elementId === undefined ? undefined : `#${item.elementId}`}
          onClick={(event) => {
            event.preventDefault();
            item.focus();
          }}
        >
          {item.label ?? item.name}: {item.message}
        </a>
      ))}
    </div>
  );
};

const SubmitState = (): ReactElement => {
  const form = useFormContext<Values>();
  const isSubmitting = useFormState(form, (state) => state.isSubmitting);
  return (
    <button type="submit" aria-busy={isSubmitting}>
      Kaydet
    </button>
  );
};

type Props = {
  onSubmit?: (values: z.output<typeof schema>) => unknown;
  mode?: FormMode;
  formRef?: { current: FormApi<Values> | null };
};

const SignUp = ({ onSubmit = vi.fn(), mode, formRef }: Props): ReactElement => {
  const form = useForm({
    schema,
    defaultValues: { email: "", name: "", password: "", confirm: "", note: "" },
    onSubmit,
    ...(mode === undefined ? {} : { mode }),
  });
  if (formRef !== undefined) formRef.current = form;
  renders.form = (renders.form ?? 0) + 1;
  return (
    <Form form={form} aria-label="Kayıt">
      <Summary />
      <TextInput name="email" label="E-posta" hint="İş adresiniz" />
      <TextInput name="name" label="Ad" />
      <TextInput name="password" label="Şifre" />
      <TextInput name="confirm" label="Şifre (tekrar)" />
      <TextInput name="note" label="Not" />
      <SubmitState />
    </Form>
  );
};

const fillValid = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("E-posta"), "ada@example.com");
  await user.type(screen.getByLabelText("Ad"), "Ada");
  await user.type(screen.getByLabelText("Şifre"), "gizli");
  await user.type(screen.getByLabelText("Şifre (tekrar)"), "gizli");
};

describe("a headless form", () => {
  test("should render a noValidate form with linked, accessible fields", async () => {
    const { container } = render(<SignUp />);
    const form = screen.getByRole("form", { name: "Kayıt" });
    expect(form).toHaveProperty("noValidate", true);
    const email = screen.getByLabelText("E-posta");
    expect(email.getAttribute("aria-required")).toBe("true");
    expect(email.getAttribute("aria-invalid")).toBeNull();
    expect(email.getAttribute("aria-describedby")).toBe(`${email.id}-hint`);
    expect(
      screen.getByLabelText("Not").getAttribute("aria-required")
    ).toBeNull();
    await expectNoAxeViolations(container);
  });

  test("should stay silent while typing before the first submit", async () => {
    const user = userEvent.setup();
    render(<SignUp />);
    await user.type(screen.getByLabelText("E-posta"), "x");
    await user.tab();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("should show every error on submit, link it and focus the first invalid field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(<SignUp onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    expect(onSubmit).not.toHaveBeenCalled();
    const email = screen.getByLabelText("E-posta");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(email.getAttribute("aria-describedby")).toBe(
      `${email.id}-error ${email.id}-hint`
    );
    expect(document.activeElement).toBe(email);
    expect(screen.getByTestId("summary").textContent).toContain(
      "E-posta: Geçerli bir e-posta girin"
    );
    await expectNoAxeViolations(container);
  });

  test("should clear an error while the user fixes it after a submit", async () => {
    const user = userEvent.setup();
    render(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    await user.type(screen.getByLabelText("Ad"), "Ad");
    expect(screen.getByLabelText("Ad").getAttribute("aria-invalid")).toBeNull();
  });

  test("should land a cross-field error on its field", async () => {
    const user = userEvent.setup();
    render(<SignUp />);
    await fillValid(user);
    await user.type(screen.getByLabelText("Şifre (tekrar)"), "x");
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    expect(document.activeElement).toBe(
      screen.getByLabelText("Şifre (tekrar)")
    );
    expect(
      screen.getAllByRole("alert").map((node) => node.textContent)
    ).toEqual(["Şifreler eşleşmiyor"]);
  });

  test("should submit with Enter and pass the parsed values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<SignUp onSubmit={onSubmit} />);
    await fillValid(user);
    await user.type(screen.getByLabelText("Not"), "{Enter}");
    expect(onSubmit).toHaveBeenCalledWith(
      {
        email: "ada@example.com",
        name: "Ada",
        password: "gizli",
        confirm: "gizli",
        note: "",
      },
      expect.any(Object)
    );
  });

  test("should mark the button busy and ignore double submits", async () => {
    const user = userEvent.setup();
    let finish = (): void => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    render(<SignUp onSubmit={onSubmit} />);
    await fillValid(user);
    const button = screen.getByRole("button", { name: "Kaydet" });
    await user.click(button);
    expect(button.getAttribute("aria-busy")).toBe("true");
    await user.click(button);
    await act(async () => finish());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("aria-busy")).toBe("false");
  });

  test("should render only the field that changes while typing", async () => {
    const user = userEvent.setup();
    render(<SignUp />);
    for (const key of Object.keys(renders)) delete renders[key];
    await user.type(screen.getByLabelText("E-posta"), "abc");
    expect(renders.email).toBe(3);
    expect(renders.name).toBeUndefined();
    expect(renders.form).toBeUndefined();
  });

  test("should show server errors on their fields and the rest in the summary", async () => {
    const formRef: { current: FormApi<Values> | null } = { current: null };
    render(<SignUp formRef={formRef} />);
    act(() => {
      formRef.current?.applyServerErrors({
        status: 400,
        detail: "Bu e-posta kayıtlı.",
        fields: ["email", "companyId"],
      });
    });
    await nextFrame();
    const email = screen.getByLabelText("E-posta");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(email);
  });

  test("should focus the summary when no field on screen has the error", async () => {
    const user = userEvent.setup();
    const onSubmit = (
      _values: unknown,
      helpers: { applyServerErrors: (e: object) => void }
    ) =>
      helpers.applyServerErrors({
        status: 409,
        detail: "Kayıt bu arada değişti.",
      });
    render(<SignUp onSubmit={onSubmit as never} />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    const summary = screen.getByTestId("summary");
    expect(summary.textContent).toBe("Kayıt bu arada değişti.");
    expect(document.activeElement).toBe(summary);
  });

  test("should focus a field from a summary link", async () => {
    const user = userEvent.setup();
    render(<SignUp />);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    await user.click(screen.getByText("Ad: En az 2 harf"));
    expect(document.activeElement).toBe(screen.getByLabelText("Ad"));
  });

  test("should behave the same under StrictMode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <StrictMode>
        <SignUp onSubmit={onSubmit} />
      </StrictMode>
    );
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    await nextFrame();
    expect(document.activeElement).toBe(screen.getByLabelText("E-posta"));
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("should watch one value without rendering on others", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    const Watcher = (): null => {
      const form = useFormContext<Values>();
      seen.push(useWatch(form, "name"));
      return null;
    };
    const Host = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: {
          email: "",
          name: "",
          password: "",
          confirm: "",
          note: "",
        },
        onSubmit: vi.fn(),
      });
      return (
        <Form form={form}>
          <Watcher />
          <TextInput name="name" label="Ad" />
          <TextInput name="email" label="E-posta" />
        </Form>
      );
    };
    render(<Host />);
    await user.type(screen.getByLabelText("E-posta"), "x");
    await user.type(screen.getByLabelText("Ad"), "A");
    expect(seen).toEqual(["", "A"]);
  });

  test("should read the latest callbacks and keep one form for the component's life", async () => {
    const user = userEvent.setup();
    const forms = new Set<unknown>();
    const first = vi.fn();
    const second = vi.fn();
    const Host = ({ onSubmit }: { onSubmit: () => void }): ReactElement => {
      const form = useForm({
        schema: z.object({ a: z.string() }),
        defaultValues: { a: "" },
        onSubmit,
      });
      forms.add(form);
      return (
        <Form form={form}>
          <button type="submit">Gönder</button>
        </Form>
      );
    };
    const { rerender } = render(<Host onSubmit={first} />);
    rerender(<Host onSubmit={second} />);
    await user.click(screen.getByRole("button"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
    expect(forms.size).toBe(1);
  });

  test("should throw a clear error for useFormContext outside a form", () => {
    const Orphan = (): null => {
      useFormContext();
      return null;
    };
    silenceRenderErrors();
    expect(() => render(<Orphan />)).toThrow(
      "useFormContext() must be called inside a <Form>"
    );
  });

  test("should register a field by an explicit id", () => {
    const Host = (): ReactElement => {
      const form = useForm({
        schema: z.object({ a: z.string() }),
        defaultValues: { a: undefined as never },
        onSubmit: vi.fn(),
      });
      const ref = useRef(form);
      const field = useField(ref.current, "a", { id: "own-id" });
      return <input aria-label="A" {...field.inputProps} />;
    };
    render(<Host />);
    const input = screen.getByLabelText("A") as HTMLInputElement;
    expect(input.id).toBe("own-id");
    expect(input.value).toBe("");
  });
});
