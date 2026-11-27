import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState, type ReactElement } from "react";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import {
  Form,
  numberFormat,
  useErrorSummary,
  useField,
  useFieldArray,
  useFieldFormat,
  useForm,
  useFormContext,
  useFormState,
  useRegisterField,
  useUnsavedChanges,
  useWatch,
  type FormApi,
} from "../lib/index";
import { renderForm, silenceRenderErrors } from "./fixtures/ui";

const schema = z.object({
  name: z.string().min(2, "Ad kısa"),
  email: z.email("E-posta geçersiz"),
  note: z.string().nullable().optional(),
  address: z.object({ city: z.string() }),
  items: z.array(z.object({ title: z.string() })).min(1, "En az bir satır"),
});
type Values = z.input<typeof schema>;
const DEFAULTS: Values = {
  name: "",
  email: "",
  note: null,
  address: { city: "" },
  items: [{ title: "a" }],
};

const TextInput = ({
  name,
  label,
  hint,
  id,
}: {
  name: "name" | "email";
  label: string;
  hint?: string;
  id?: string;
}): ReactElement => {
  const form = useFormContext<Values>();
  const field = useField(form, name, {
    label,
    ...(id === undefined ? {} : { id }),
    hasHint: hint !== undefined,
  });
  return (
    <div>
      <label htmlFor={field.id}>{label}</label>
      <input {...field.inputProps} />
      {hint !== undefined && <p id={field.hintId}>{hint}</p>}
      {field.error !== undefined && (
        <p id={field.errorId} role="alert">
          {field.error}
        </p>
      )}
    </div>
  );
};

describe("useForm", () => {
  test("should keep one form for the component's life and not render it while typing", async () => {
    const renders = vi.fn();
    const forms = new Set<FormApi<Values>>();
    const Page = (): ReactElement => {
      const form = useForm({
        schema,
        defaultValues: DEFAULTS,
        onSubmit: () => {},
      });
      renders();
      forms.add(form);
      return (
        <Form form={form}>
          <TextInput name="name" label="Ad" />
        </Form>
      );
    };
    const { rerender } = render(<Page />);
    await userEvent.type(screen.getByLabelText("Ad"), "Ada");
    expect(renders).toHaveBeenCalledTimes(1);
    rerender(<Page />);
    expect(forms.size).toBe(1);
    expect(screen.getByLabelText("Ad")).toHaveProperty("value", "Ada");
  });

  test("should call the onSubmit of the latest render", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const Page = ({ onSubmit }: { onSubmit: () => void }): ReactElement => {
      const form = useForm({
        schema: z.object({ a: z.string() }),
        defaultValues: { a: "" },
        onSubmit,
      });
      return (
        <Form form={form}>
          <button type="submit">Gönder</button>
        </Form>
      );
    };
    const { rerender } = render(<Page onSubmit={first} />);
    rerender(<Page onSubmit={second} />);
    await userEvent.click(screen.getByRole("button", { name: "Gönder" }));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("Form", () => {
  test("should render a noValidate form that submits on Enter and passes its props", async () => {
    const onSubmit = vi.fn();
    const { user, container } = renderForm(
      {
        schema: z.object({ name: z.string(), email: z.string() }),
        defaultValues: { name: "", email: "" },
        onSubmit,
        formProps: { "aria-label": "Profil", className: "profile" },
      },
      <>
        <TextInput name="name" label="Ad" />
        <button type="submit">Kaydet</button>
      </>
    );
    const form = container.querySelector("form");
    expect(form).toHaveProperty("noValidate", true);
    expect(form?.className).toBe("profile");
    expect(screen.getByRole("form", { name: "Profil" })).toBe(form);
    await user.type(screen.getByLabelText("Ad"), "Ada{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: "Ada", email: "" });
  });
});

describe("useField", () => {
  test("should link the label, hint and error and mark the control", async () => {
    const { user } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <TextInput name="name" label="Ad" hint="Tam adınız" id="name-input" />
        <button type="submit">Kaydet</button>
      </>
    );
    const input = screen.getByLabelText("Ad");
    expect(input.id).toBe("name-input");
    expect(input.getAttribute("name")).toBe("name");
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBe("name-input-hint");

    await user.click(screen.getByRole("button", { name: "Kaydet" }));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(
      "name-input-error name-input-hint"
    );
    expect(screen.getAllByRole("alert")[0]?.textContent).toBe("Ad kısa");
  });

  test("should render only the field that changed", async () => {
    const renders: Record<string, number> = { name: 0, email: 0 };
    const Counted = ({ name }: { name: "name" | "email" }): ReactElement => {
      const form = useFormContext<Values>();
      const field = useField(form, name);
      renders[name] = (renders[name] ?? 0) + 1;
      return <input aria-label={name} {...field.inputProps} />;
    };
    const { user } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <Counted name="name" />
        <Counted name="email" />
      </>
    );
    const before = renders.email;
    await user.type(screen.getByLabelText("name"), "Ada");
    expect(renders.email).toBe(before);
    expect(renders.name).toBeGreaterThan(3);
  });

  test("should show null and undefined as empty text and register no extras", () => {
    const Note = (): ReactElement => {
      const form = useFormContext<Values>();
      const field = useField(form, "note");
      return <input aria-label="Not" {...field.inputProps} />;
    };
    const { form } = renderForm({ schema, defaultValues: DEFAULTS }, <Note />);
    expect(screen.getByLabelText("Not")).toHaveProperty("value", "");
    act(() => form.setValue("note", undefined));
    expect(screen.getByLabelText("Not")).toHaveProperty("value", "");
    act(() => form.setValue("note", "x"));
    expect(screen.getByLabelText("Not")).toHaveProperty("value", "x");
    expect(form.getFieldLabel("note")).toBeUndefined();
  });

  test("should run the latest field validator on blur", async () => {
    const Email = (): ReactElement => {
      const form = useFormContext<Values>();
      const [taken, setTaken] = useState("a@b.co");
      const field = useField(form, "email", {
        label: "E-posta",
        validate: (value) => (value === taken ? "Kayıtlı" : undefined),
      });
      return (
        <>
          <input aria-label="E-posta" {...field.inputProps} />
          <button type="button" onClick={() => setTaken("c@d.co")}>
            Değiştir
          </button>
          {field.error !== undefined && <p role="alert">{field.error}</p>}
        </>
      );
    };
    const { user } = renderForm(
      { schema, defaultValues: DEFAULTS, mode: "blur" },
      <Email />
    );
    await user.click(screen.getByRole("button", { name: "Değiştir" }));
    await user.type(screen.getByLabelText("E-posta"), "c@d.co");
    await user.tab();
    expect((await screen.findByRole("alert")).textContent).toBe("Kayıtlı");
  });
});

describe("useWatch and useFormState", () => {
  test("should render a watcher only when its branch changes", async () => {
    const renders = vi.fn();
    const City = (): ReactElement => {
      const form = useFormContext<Values>();
      const address = useWatch(form, "address");
      renders();
      return <output>{address.city}</output>;
    };
    const { form } = renderForm({ schema, defaultValues: DEFAULTS }, <City />);
    act(() => form.setValue("name", "Ada"));
    expect(renders).toHaveBeenCalledTimes(1);
    act(() => form.setValue("address.city", "İzmir"));
    expect(renders).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status").textContent).toBe("İzmir");
  });

  test("should select a slice, compared shallowly, or the whole state", () => {
    const sliceRenders = vi.fn();
    const Slice = (): ReactElement => {
      const form = useFormContext<Values>();
      const { isDirty } = useFormState(form, (state) => ({
        isDirty: state.isDirty,
      }));
      sliceRenders();
      return <span>{isDirty ? "kirli" : "temiz"}</span>;
    };
    const Whole = (): ReactElement => {
      const form = useFormContext<Values>();
      const state = useFormState(form);
      return <span>{state.values.name || "boş"}</span>;
    };
    const Exact = (): ReactElement => {
      const form = useFormContext<Values>();
      const count = useFormState(
        form,
        (state) => state.submitCount,
        (a, b) => a === b
      );
      return <span>{`gönderim ${count}`}</span>;
    };
    const { form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <Slice />
        <Whole />
        <Exact />
      </>
    );
    act(() => form.setValue("name", "A"));
    act(() => form.setValue("name", "Ad"));
    expect(screen.getByText("kirli")).toBeTruthy();
    expect(screen.getByText("Ad")).toBeTruthy();
    expect(screen.getByText("gönderim 0")).toBeTruthy();
    expect(sliceRenders).toHaveBeenCalledTimes(2);
  });
});

describe("useFieldArray", () => {
  test("should give stable rows and the array's own error", async () => {
    const Items = (): ReactElement => {
      const form = useFormContext<Values>();
      const { rows, error, append, remove } = useFieldArray(form, "items");
      return (
        <>
          {error !== undefined && <p role="alert">{error}</p>}
          <ul>
            {rows.map((row) => (
              <li key={row.key} data-key={row.key}>
                {`${row.index}:${row.name}`}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => append({ title: "b" })}>
            Ekle
          </button>
          <button type="button" onClick={() => remove(0)}>
            Sil
          </button>
        </>
      );
    };
    const { user, form } = renderForm(
      { schema, defaultValues: DEFAULTS, mode: "change" },
      <Items />
    );
    const firstKey = screen.getByRole("listitem").dataset.key;
    await user.click(screen.getByRole("button", { name: "Ekle" }));
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent)
    ).toEqual(["0:items.0", "1:items.1"]);
    await user.click(screen.getByRole("button", { name: "Sil" }));
    expect(screen.getByRole("listitem").dataset.key).not.toBe(firstKey);
    await user.click(screen.getByRole("button", { name: "Sil" }));
    expect(screen.getByRole("alert").textContent).toBe("En az bir satır");
    act(() => form.applyServerErrors({ items: "Sunucu" }));
    expect(form.getState().formErrors).toEqual([]);
    // The array has no element of its own to focus.
    expect(form.getFieldElement("items")).toBeNull();
  });
});

describe("useFieldFormat", () => {
  const Amount = ({ decimals = 2 }: { decimals?: number }): ReactElement => {
    const form = useFormContext<{ amount?: number }>();
    const field = useField(form, "amount");
    const text = useFieldFormat(field, numberFormat({ decimals }));
    return <input aria-label="Tutar" {...field.controlProps} {...text} />;
  };
  const amountSchema = z.object({ amount: z.number().optional() });

  test("should mask while typing, keep the caret and write the parsed value", async () => {
    const { user, form } = renderForm(
      { schema: amountSchema, defaultValues: {} },
      <Amount />
    );
    const input = screen.getByLabelText("Tutar") as HTMLInputElement;
    await user.type(input, "1234,5");
    expect(input.value).toBe("1.234,5");
    expect(form.getValue("amount")).toBe(1234.5);
    await user.type(input, "6", {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });
    expect(input.value).toBe("16.234,5");
    expect(input.selectionStart).toBe(2);
    await user.tab();
    expect(input.value).toBe("16.234,5");
  });

  test("should take the caret to the end when the input reports none", () => {
    const { form } = renderForm(
      { schema: amountSchema, defaultValues: {} },
      <Amount />
    );
    const input = screen.getByLabelText("Tutar") as HTMLInputElement;
    Object.defineProperty(input, "selectionStart", {
      configurable: true,
      get: () => null,
    });
    fireEvent.change(input, { target: { value: "12345" } });
    expect(input.value).toBe("12.345");
    expect(form.getValue("amount")).toBe(12345);
  });

  test("should show values set from outside and tidy the text on blur", async () => {
    const { user, form } = renderForm(
      { schema: amountSchema, defaultValues: { amount: 1000 } },
      <Amount />
    );
    const input = screen.getByLabelText("Tutar") as HTMLInputElement;
    expect(input.value).toBe("1.000");
    act(() => form.setValue("amount", 2500.5));
    expect(input.value).toBe("2.500,5");
    act(() => form.reset());
    expect(input.value).toBe("1.000");
    await user.clear(input);
    await user.type(input, "7,50");
    await user.tab();
    expect(input.value).toBe("7,5");
  });

  test("should work without a mask", async () => {
    const Plain = (): ReactElement => {
      const form = useFormContext<{ code: string }>();
      const field = useField(form, "code");
      const text = useFieldFormat(field, {
        format: (value) => value ?? "",
        parse: (value) => value.toUpperCase(),
      });
      return <input aria-label="Kod" {...text} />;
    };
    const { user, form } = renderForm(
      { schema: z.object({ code: z.string() }), defaultValues: { code: "" } },
      <Plain />
    );
    await user.type(screen.getByLabelText("Kod"), "ab");
    expect(form.getValue("code")).toBe("AB");
    expect(screen.getByLabelText("Kod")).toHaveProperty("value", "ab");
    await user.tab();
    expect(screen.getByLabelText("Kod")).toHaveProperty("value", "AB");
  });
});

describe("useUnsavedChanges", () => {
  test("should report unsaved changes and guard the page only when asked", async () => {
    const Guard = ({
      blockUnload,
    }: {
      blockUnload?: boolean;
    }): ReactElement => {
      const form = useFormContext<Values>();
      const hasUnsavedChanges = useUnsavedChanges(
        form,
        blockUnload === undefined ? undefined : { blockUnload }
      );
      return <output>{hasUnsavedChanges ? "kaydedilmedi" : "kayıtlı"}</output>;
    };
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <Guard />
        <Guard blockUnload />
      </>
    );
    const unloads = (): number =>
      add.mock.calls.filter(([type]) => type === "beforeunload").length;
    expect(unloads()).toBe(0);
    act(() => form.setValue("name", "Ada"));
    expect(
      screen.getAllByRole("status").map((node) => node.textContent)
    ).toEqual(["kaydedilmedi", "kaydedilmedi"]);
    expect(unloads()).toBe(1);

    const event = new Event("beforeunload", {
      cancelable: true,
    }) as BeforeUnloadEvent;
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    act(() => form.setValue("name", ""));
    expect(remove.mock.calls.some(([type]) => type === "beforeunload")).toBe(
      true
    );
    expect(screen.getAllByRole("status")[0]?.textContent).toBe("kayıtlı");
  });
});

describe("useErrorSummary", () => {
  test("should list the visible errors after a submit, with labels and links", async () => {
    let summary: ReturnType<typeof useErrorSummary> | undefined;
    const Summary = (): ReactElement => {
      const form = useFormContext<Values>();
      const result = useErrorSummary(form);
      summary = result;
      return (
        <div
          tabIndex={-1}
          ref={(element) => {
            result.ref.current = element;
          }}
        >
          {result.isVisible ? "görünür" : "gizli"}
        </div>
      );
    };
    const Custom = (): ReactElement => {
      const form = useFormContext<Values>();
      const ref = useRef<HTMLDivElement>(null);
      useRegisterField(form, "address.city", { getElement: () => ref.current });
      return <div ref={ref} />;
    };
    const { form } = renderForm(
      { schema, defaultValues: DEFAULTS },
      <>
        <Summary />
        <TextInput name="name" label="Ad" id="name-input" />
        <Custom />
      </>
    );
    expect(screen.getByText("gizli")).toBeTruthy();
    await act(() => form.handleSubmit());
    act(() => {
      form.setError("address.city", "Şehir");
      form.setFormError("Genel");
    });
    expect(screen.getByText("görünür")).toBeTruthy();
    const items = summary?.items ?? [];
    expect(
      items.map(({ name, label, elementId }) => ({ name, label, elementId }))
    ).toEqual([
      { name: "name", label: "Ad", elementId: "name-input" },
      { name: "email", label: undefined, elementId: undefined },
      { name: "address.city", label: undefined, elementId: undefined },
    ]);
    expect(summary?.formErrors).toEqual(["Genel"]);
    expect(items[0]?.focus()).toBe(true);
    expect(document.activeElement?.id).toBe("name-input");
    expect(items[1]?.focus()).toBe(false);
  });
});

describe("useFormContext", () => {
  test("should throw outside a <Form>", () => {
    const Orphan = (): ReactElement => {
      useFormContext();
      return <></>;
    };
    silenceRenderErrors();
    expect(() => render(<Orphan />)).toThrow(
      "@handijitcom/forms: useFormContext() must be called inside a <Form>."
    );
  });
});

describe("useRegisterField", () => {
  test("should register a hand-made control until it unmounts", () => {
    const Stars = (): ReactElement => {
      const form = useFormContext<{ name: string }>();
      useRegisterField(form, "name", {
        getElement: () => document.getElementById("stars"),
        label: "Puan",
      });
      return <div id="stars" tabIndex={-1} />;
    };
    const { form, rerender } = renderForm(
      { schema: z.object({ name: z.string() }), defaultValues: { name: "x" } },
      <Stars />
    );
    expect(form.getFieldLabel("name")).toBe("Puan");
    expect(form.getFieldElement("name")?.id).toBe("stars");
    rerender(<></>);
    expect(form.getFieldLabel("name")).toBeUndefined();
  });
});
