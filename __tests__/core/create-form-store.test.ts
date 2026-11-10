import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import createFormStore, {
  type StoreOptions,
} from "../../lib/core/create-form-store";
import type { FormApi, FormMode } from "../../lib/types/form.type";

const schema = z
  .object({
    email: z.email("Geçerli bir e-posta girin"),
    name: z.string().min(2, "En az 2 harf"),
    password: z.string(),
    confirm: z.string(),
    items: z.array(z.object({ title: z.string().min(1, "Başlık gerekli") })),
  })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "Şifreler eşleşmiyor",
  });

type Values = z.input<typeof schema>;

const defaults: Values = {
  email: "",
  name: "",
  password: "",
  confirm: "",
  items: [],
};

const valid: Values = {
  email: "a@b.co",
  name: "Ada",
  password: "x",
  confirm: "x",
  items: [{ title: "t" }],
};

const flush = async (): Promise<void> => {
  for (let index = 0; index < 20; index += 1) await Promise.resolve();
};

const setup = (
  overrides: Partial<StoreOptions> & { mode?: FormMode } = {},
  values: Values = defaults
): { form: FormApi<Values>; options: StoreOptions } => {
  const options: StoreOptions = {
    schema,
    onSubmit: vi.fn(),
    ...overrides,
  };
  return { form: createFormStore<Values>(values, () => options), options };
};

const fill = (form: FormApi<Values>, values: Values): void => {
  for (const [key, value] of Object.entries(values)) {
    form.setValue(key as keyof Values, value as never);
  }
};

afterEach(() => {
  vi.useRealTimers();
});

describe("createFormStore: values and subscriptions", () => {
  test("should start from the defaults, clean and quiet", () => {
    const { form } = setup();
    expect(form.getValues()).toBe(defaults);
    expect(form.getState()).toMatchObject({
      errors: {},
      formErrors: [],
      touched: {},
      isDirty: false,
      isSubmitting: false,
      isValidating: false,
      isSubmitSuccessful: false,
      submitCount: 0,
    });
    expect(form.messages.submitFailed).toBe(
      "Form gönderilemedi. Lütfen tekrar deneyin."
    );
  });

  test("should override the default texts", () => {
    const { form } = setup({ messages: { submitFailed: "Olmadı" } });
    expect(form.messages).toEqual({
      submitFailed: "Olmadı",
      serverFieldError: "Bu alanı kontrol edin.",
    });
  });

  test("should set values immutably, notify and track dirtiness", () => {
    const { form } = setup();
    const listener = vi.fn();
    const unsubscribe = form.subscribe(listener);
    form.setValue("name", "Ada");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(form.getValue("name")).toBe("Ada");
    expect(form.getState().isDirty).toBe(true);
    expect(form.getFieldState("name")).toMatchObject({
      value: "Ada",
      isDirty: true,
      isTouched: false,
    });
    form.setValue("name", "");
    expect(form.getState().isDirty).toBe(false);
    unsubscribe();
    form.setValue("name", "B");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("should derive required fields from the schema and remember them", () => {
    const { form, options } = setup();
    expect(form.getFieldState("email").isRequired).toBe(true);
    expect(form.getFieldState("password").isRequired).toBe(false);
    expect(form.getFieldState("email").isRequired).toBe(true);
    options.schema = z.object({ email: z.string().optional() });
    expect(form.getFieldState("email").isRequired).toBe(false);
  });
});

describe("createFormStore: validation timing", () => {
  test("should stay silent before the first submit in submit mode", () => {
    const { form } = setup();
    form.setValue("email", "nope");
    form.blur("email");
    expect(form.getState().errors).toEqual({});
    expect(form.getState().touched).toEqual({ email: true });
  });

  test("should reveal a field on blur in blur mode and update it while typing", () => {
    const { form } = setup({ mode: "blur" });
    form.setValue("email", "nope");
    expect(form.getState().errors).toEqual({});
    form.blur("email");
    expect(form.getState().errors).toEqual({
      email: "Geçerli bir e-posta girin",
    });
    form.setValue("email", "a@b.co");
    expect(form.getState().errors).toEqual({});
    // Other fields stay hidden.
    expect(form.getState().errors.name).toBeUndefined();
  });

  test("should not notify again for a second blur that changes nothing", () => {
    const { form } = setup();
    form.blur("email");
    const listener = vi.fn();
    form.subscribe(listener);
    form.blur("email");
    expect(listener).not.toHaveBeenCalled();
  });

  test("should reveal a field on change in change mode", () => {
    const { form } = setup({ mode: "change" });
    form.setValue("name", "A");
    expect(form.getState().errors).toEqual({ name: "En az 2 harf" });
  });

  test("should land cross-field refinements on their path", () => {
    const { form } = setup({ mode: "change" });
    form.setValue("password", "a");
    form.setValue("confirm", "b");
    expect(form.getState().errors.confirm).toBe("Şifreler eşleşmiyor");
  });

  test("should honour shouldValidate and shouldTouch", () => {
    const { form } = setup();
    form.setValue("name", "A", { shouldValidate: true });
    expect(form.getState().errors).toEqual({ name: "En az 2 harf" });
    const blurMode = setup({ mode: "blur" }).form;
    blurMode.setValue("name", "A", { shouldTouch: true });
    expect(blurMode.getState().touched).toEqual({ name: true });
    expect(blurMode.getState().errors).toEqual({ name: "En az 2 harf" });
    const submitMode = setup().form;
    submitMode.setValue("name", "A", { shouldTouch: true });
    expect(submitMode.getState().errors).toEqual({});
  });

  test("should show every error after a submit and check on each change", async () => {
    const { form, options } = setup();
    await form.handleSubmit();
    expect(Object.keys(form.getState().errors).sort()).toEqual([
      "email",
      "name",
    ]);
    expect(options.onSubmit).not.toHaveBeenCalled();
    form.setValue("name", "Ada");
    expect(form.getState().errors.name).toBeUndefined();
  });

  test("should show root refinements as form errors after a submit only", async () => {
    const { form } = setup({
      schema: z.object({ a: z.string() }).refine(() => false, "Hep yanlış"),
      mode: "change",
    });
    form.setValue("a" as never, "x" as never);
    expect(form.getState().formErrors).toEqual([]);
    await form.handleSubmit();
    expect(form.getState().formErrors).toEqual(["Hep yanlış"]);
  });

  test("should validate on demand and reveal everything", async () => {
    const { form } = setup();
    await expect(form.validate()).resolves.toBe(false);
    expect(form.getState().errors.email).toBeDefined();
    fill(form, valid);
    await expect(form.validate()).resolves.toBe(true);
  });

  test("should run async schemas, keep only the latest result and report isValidating", async () => {
    const pending: ((value: boolean) => void)[] = [];
    const asyncSchema = z.object({
      name: z.string().refine(
        () =>
          new Promise<boolean>((resolve) => {
            pending.push(resolve);
          }),
        "Alınmış"
      ),
    });
    const { form } = setup({ schema: asyncSchema, mode: "change" });
    form.setValue("name", "a");
    await flush();
    expect(form.getState().isValidating).toBe(true);
    form.setValue("name", "ab");
    await flush();
    // [0] is the synchronous first try that found the schema async; [1] and [2] are the two
    // runs. The newer passes, the older fails late: the older result is dropped.
    expect(pending).toHaveLength(3);
    pending[2]?.(true);
    await flush();
    pending[1]?.(false);
    await flush();
    expect(form.getState().errors).toEqual({});
    expect(form.getState().isValidating).toBe(false);
  });

  test("should surface a schema that throws instead of swallowing it", () => {
    const { form } = setup({
      schema: z.object({ a: z.string() }).superRefine(() => {
        throw new Error("bug in schema");
      }),
      mode: "change",
    });
    expect(() => form.setValue("a" as never, "x" as never)).toThrow(
      "bug in schema"
    );
  });

  test("should surface an async schema that rejects", async () => {
    vi.useFakeTimers();
    // The first call is the synchronous try that finds the schema async; its promise is
    // dropped, so only the real run rejects.
    let calls = 0;
    const { form } = setup({
      schema: z.object({
        a: z.string().refine(async () => {
          calls += 1;
          if (calls > 1) throw new Error("async bug");
          return true;
        }),
      }),
      mode: "change",
    });
    expect(() => form.setValue("a" as never, "x" as never)).not.toThrow();
    await flush();
    expect(() => vi.runAllTimers()).toThrow("async bug");
  });
});

describe("createFormStore: field validators", () => {
  const registerValidator = (
    form: FormApi<Values>,
    validate: (value: unknown) => unknown
  ): void => {
    form.registerField("email", {
      getElement: () => null,
      validate: validate as never,
    });
  };

  test("should run on blur after a submit, skip a value it checked and mark validating", async () => {
    const { form } = setup();
    const validate = vi.fn(async (value: unknown) =>
      value === "taken@b.co" ? "Bu e-posta kayıtlı" : undefined
    );
    registerValidator(form, validate);
    form.setValue("email", "taken@b.co");
    form.blur("email");
    expect(validate).not.toHaveBeenCalled();
    await form.handleSubmit();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(form.getState().errors.email).toBe("Bu e-posta kayıtlı");
    form.blur("email");
    await flush();
    expect(validate).toHaveBeenCalledTimes(1);
    form.setValue("email", "free@b.co");
    expect(form.getState().errors.email).toBeUndefined();
    form.blur("email");
    expect(form.getState().isValidating).toBe(false);
    await flush();
    expect(validate).toHaveBeenCalledTimes(2);
    expect(form.getFieldState("email").isValidating).toBe(false);
  });

  test("should run on blur in blur mode and not when the schema already rejects", async () => {
    const { form } = setup({ mode: "blur" });
    const validate = vi.fn(() => "Hayır");
    registerValidator(form, validate);
    form.setValue("email", "bad");
    form.blur("email");
    await flush();
    expect(validate).not.toHaveBeenCalled();
    form.setValue("email", "a@b.co");
    form.blur("email");
    await flush();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(form.getState().errors.email).toBe("Hayır");
  });

  test("should use the first registered validator of a field", async () => {
    const { form } = setup({ mode: "blur" });
    const signals: AbortSignal[] = [];
    const resolvers: ((message: string | undefined) => void)[] = [];
    registerValidator(form, () => undefined);
    form.registerField("email", {
      getElement: () => null,
      validate: ((_value: unknown, context: { signal: AbortSignal }) => {
        signals.push(context.signal);
        return new Promise((resolve) => {
          resolvers.push(resolve);
        });
      }) as never,
    });
    // The first registration with a validator wins.
    form.setValue("email", "a@b.co");
    form.blur("email");
    await flush();
    expect(signals).toHaveLength(0);
  });

  test("should keep the newest of two overlapping runs", async () => {
    const { form } = setup({ mode: "blur" });
    const resolvers: ((message: string | undefined) => void)[] = [];
    const signals: AbortSignal[] = [];
    form.registerField("email", {
      getElement: () => null,
      validate: ((_value: unknown, context: { signal: AbortSignal }) => {
        signals.push(context.signal);
        return new Promise((resolve) => {
          resolvers.push(resolve);
        });
      }) as never,
    });
    form.setValue("email", "a@b.co");
    form.blur("email");
    await flush();
    form.setValue("email", "c@d.co");
    form.blur("email");
    await flush();
    expect(signals[0]?.aborted).toBe(true);
    resolvers[1]?.(undefined);
    resolvers[0]?.("eski");
    await flush();
    expect(form.getState().errors.email).toBeUndefined();
  });

  test("should ignore the result of a run that a second run replaced", async () => {
    const { form } = setup({ mode: "blur" });
    const resolvers: ((message: string | undefined) => void)[] = [];
    form.registerField("email", {
      getElement: () => null,
      validate: (() =>
        new Promise((resolve) => {
          resolvers.push(resolve);
        })) as never,
    });
    form.setValue("email", "a@b.co");
    form.blur("email");
    await flush();
    // Submitting starts a second run for the same value while the first still runs.
    const submit = form.handleSubmit();
    await flush();
    resolvers[0]?.("eski");
    await flush();
    resolvers[1]?.(undefined);
    await submit;
    expect(form.getState().errors.email).toBeUndefined();
  });

  test("should treat a throwing validator as passing", async () => {
    const { form, options } = setup({}, valid);
    registerValidator(form, () => {
      throw new Error("network");
    });
    await form.handleSubmit();
    expect(options.onSubmit).toHaveBeenCalled();
  });

  test("should block the submit when a validator fails", async () => {
    const { form, options } = setup({}, valid);
    registerValidator(form, () => "Kayıtlı");
    await form.handleSubmit();
    expect(options.onSubmit).not.toHaveBeenCalled();
    expect(form.getState().errors.email).toBe("Kayıtlı");
  });
});

describe("createFormStore: validator bookkeeping", () => {
  const twoValidators = (): {
    form: FormApi<Values>;
    resolvers: Record<string, (message: string | undefined) => void>;
  } => {
    const { form } = setup({ mode: "blur" }, valid);
    const resolvers: Record<string, (message: string | undefined) => void> = {};
    for (const name of ["email", "name"] as const) {
      form.registerField(name, {
        getElement: () => null,
        validate: (() =>
          new Promise((resolve) => {
            resolvers[name] = resolve;
          })) as never,
      });
    }
    return { form, resolvers };
  };

  test("should keep other fields' validator state when one field changes", async () => {
    const { form, resolvers } = twoValidators();
    form.blur("email");
    form.blur("name");
    await flush();
    resolvers.email?.("E-posta kayıtlı");
    await flush();
    // name is still running; email has a result. Changing name leaves email alone.
    form.setValue("name", "Grace");
    expect(form.getState().errors.email).toBe("E-posta kayıtlı");
    form.blur("name");
    await flush();
    resolvers.name?.(undefined);
    await flush();
    expect(form.getState().errors).toEqual({ email: "E-posta kayıtlı" });
  });

  test("should forget validator state on clearErrors, reset and array changes", async () => {
    const { form, resolvers } = twoValidators();
    form.registerField("items", {
      getElement: () => null,
      validate: (() => "Satır") as never,
    });
    form.blur("items");
    form.blur("email");
    await flush();
    form.array("items").append({ title: "b" });
    expect(form.getState().errors.items).toBeUndefined();
    form.clearErrors();
    resolvers.email?.("geç");
    await flush();
    expect(form.getState().errors).toEqual({});
    form.blur("name");
    await flush();
    form.reset();
    expect(form.getState().isValidating).toBe(false);
  });

  test("should reveal through setValue after a submit", async () => {
    const { form } = setup();
    await form.handleSubmit();
    form.setValue("name", "A", { shouldValidate: true });
    expect(form.getState().errors.name).toBe("En az 2 harf");
  });
});

describe("createFormStore: submit", () => {
  test("should submit parsed values with helpers and make them the new baseline", async () => {
    const onSubmit = vi.fn();
    const { form } = setup({
      onSubmit,
      schema: z.object({ age: z.coerce.number() }) as never,
    });
    form.setValue("email" as never, undefined as never);
    (form as unknown as FormApi<{ age: string }>).setValue("age", "42");
    await form.handleSubmit({ preventDefault: vi.fn() });
    expect(onSubmit).toHaveBeenCalledWith(
      { age: 42 },
      expect.objectContaining({
        applyServerErrors: expect.any(Function),
        setError: expect.any(Function),
        setFormError: expect.any(Function),
        reset: expect.any(Function),
      })
    );
    expect(form.getState()).toMatchObject({
      isSubmitSuccessful: true,
      isSubmitting: false,
      isDirty: false,
      submitCount: 1,
    });
  });

  test("should ignore a second submit while one runs", async () => {
    let finish = (): void => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { form } = setup({ onSubmit }, valid);
    const first = form.handleSubmit();
    await flush();
    expect(form.getState().isSubmitting).toBe(true);
    await form.handleSubmit();
    finish();
    await first;
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("should call onInvalid with the visible errors", async () => {
    const onInvalid = vi.fn();
    const { form } = setup({ onInvalid });
    await form.handleSubmit();
    expect(onInvalid).toHaveBeenCalledWith(
      expect.objectContaining({ email: "Geçerli bir e-posta girin" }),
      []
    );
  });

  test("should keep the baseline that onSubmit chose with reset", async () => {
    const { form } = setup(
      {
        onSubmit: (_values: never, helpers: { reset: (v: Values) => void }) =>
          helpers.reset({ ...valid, name: "Yeni" }),
      } as never,
      valid
    );
    form.setValue("name", "Değişti");
    await form.handleSubmit();
    expect(form.getState().defaultValues.name).toBe("Yeni");
    expect(form.getState().values.name).toBe("Yeni");
  });

  test("should not count a submit with server errors as successful", async () => {
    const { form } = setup(
      {
        onSubmit: ((
          _values: never,
          helpers: { setFormError: (m: string) => void }
        ) => helpers.setFormError("Sunucu reddetti")) as never,
      },
      valid
    );
    form.setValue("name", "Başka");
    await form.handleSubmit();
    expect(form.getState().isSubmitSuccessful).toBe(false);
    expect(form.getState().isDirty).toBe(true);
    expect(form.getState().formErrors).toEqual(["Sunucu reddetti"]);
  });

  test("should show the default message when onSubmit throws", async () => {
    const { form } = setup(
      { onSubmit: () => Promise.reject(new Error("offline")) },
      valid
    );
    await form.handleSubmit();
    expect(form.getState().formErrors).toEqual([
      "Form gönderilemedi. Lütfen tekrar deneyin.",
    ]);
    expect(form.getState().isSubmitSuccessful).toBe(false);
    // The next submit starts clean.
    await form.handleSubmit();
    expect(form.getState().formErrors).toEqual([
      "Form gönderilemedi. Lütfen tekrar deneyin.",
    ]);
  });

  test("should hand a thrown error to onSubmitError", async () => {
    const error = new Error("409");
    const onSubmitError = vi.fn();
    const { form } = setup(
      { onSubmit: () => Promise.reject(error), onSubmitError },
      valid
    );
    await form.handleSubmit();
    expect(onSubmitError).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ applyServerErrors: expect.any(Function) })
    );
    expect(form.getState().formErrors).toEqual([]);
  });
});

describe("createFormStore: errors from outside", () => {
  const withFields = (): FormApi<Values> => {
    const { form } = setup();
    for (const name of ["email", "name", "items"] as const) {
      form.registerField(name, { getElement: () => null });
    }
    return form;
  };

  test("should mark the fields an RFC 9457 problem lists, with its detail", () => {
    const form = withFields();
    form.applyServerErrors({
      status: 400,
      code: "VALIDATION_ERROR",
      detail: "Girilen bilgiler geçersiz.",
      fields: ["email", "items[0].title", "taxNumber"],
    });
    expect(form.getState().errors).toEqual({
      email: "Girilen bilgiler geçersiz.",
      "items.0.title": "Girilen bilgiler geçersiz.",
    });
    // The unknown field falls to form level, once.
    expect(form.getState().formErrors).toEqual(["Girilen bilgiler geçersiz."]);
  });

  test("should fall back to title, then to the default text", () => {
    const form = withFields();
    form.applyServerErrors({
      status: 400,
      title: "Bad Request",
      fields: ["email"],
    });
    expect(form.getState().errors.email).toBe("Bad Request");
    form.applyServerErrors({ status: 400, fields: ["name"] });
    expect(form.getState().errors.name).toBe("Bu alanı kontrol edin.");
  });

  test("should put a problem without fields at form level", () => {
    const form = withFields();
    form.applyServerErrors({ status: 409, detail: "Bu kayıt değişti." });
    expect(form.getState().formErrors).toEqual(["Bu kayıt değişti."]);
    form.applyServerErrors({
      status: 500,
      detail: "Bu kayıt değişti.",
      fields: [],
    });
    expect(form.getState().formErrors).toEqual(["Bu kayıt değişti."]);
  });

  test("should read a problem with a message per field", () => {
    const form = withFields();
    form.applyServerErrors({
      status: 400,
      detail: "Genel",
      fields: { email: "Kayıtlı", name: null },
    });
    expect(form.getState().errors).toEqual({ email: "Kayıtlı", name: "Genel" });
  });

  test("should read a plain map of field messages", () => {
    const form = withFields();
    form.applyServerErrors({
      email: ["", "Kayıtlı", "ikinci"],
      name: undefined,
      "": "Form düzeyi",
      unknown: "Görünmeyen alan",
    });
    expect(form.getState().errors).toEqual({ email: "Kayıtlı" });
    expect(form.getState().formErrors).toEqual([
      "Form düzeyi",
      "Görünmeyen alan",
    ]);
    expect(form.getState().isSubmitSuccessful).toBe(false);
  });

  test("should clear a server error when its field changes, and only then", () => {
    const form = withFields();
    form.applyServerErrors({ email: "Kayıtlı", name: "Kısa" });
    form.setValue("email", "x@y.co");
    expect(form.getState().errors).toEqual({ name: "Kısa" });
  });

  test("should set and clear manual errors", () => {
    const { form } = setup({ mode: "change" });
    form.setError("email", "Elle");
    form.setFormError("Form");
    form.setFormError("Form");
    form.setValue("name", "A");
    expect(form.getState().errors).toEqual({
      email: "Elle",
      name: "En az 2 harf",
    });
    expect(form.getState().formErrors).toEqual(["Form"]);
    form.clearErrors("email");
    expect(form.getState().errors).toEqual({ name: "En az 2 harf" });
    form.clearErrors();
    expect(form.getState().errors).toEqual({});
    expect(form.getState().formErrors).toEqual([]);
  });

  test("should show a descendant error on its ancestor field", () => {
    const { form } = setup();
    form.setError("items.0.title" as never, "Boş");
    expect(form.getFieldState("items").error).toBe("Boş");
    expect(form.getFieldState("email").error).toBeUndefined();
  });
});

describe("createFormStore: reset", () => {
  test("should go back to the defaults and forget everything else", async () => {
    const { form } = setup({ mode: "change" });
    form.setValue("name", "A");
    form.blur("name");
    await form.handleSubmit();
    form.setFormError("x");
    form.reset();
    expect(form.getState()).toMatchObject({
      values: defaults,
      errors: {},
      formErrors: [],
      touched: {},
      submitCount: 0,
      isDirty: false,
    });
  });

  test("should take new values as the baseline for later resets", () => {
    const { form } = setup();
    form.reset(valid);
    form.setValue("name", "Değişti");
    expect(form.getState().isDirty).toBe(true);
    form.reset();
    expect(form.getValues()).toEqual(valid);
  });
});

describe("createFormStore: arrays", () => {
  test("should give each row a key that follows it", () => {
    const { form } = setup(
      {},
      { ...defaults, items: [{ title: "a" }, { title: "b" }] }
    );
    const items = form.array("items");
    expect(form.array("items")).toBe(items);
    const [first, second] = form.getArrayKeys("items");
    expect(form.getArrayKeys("items")).toEqual([first, second]);
    items.append({ title: "c" });
    items.prepend({ title: "z" });
    items.insert(1, { title: "y" });
    expect(form.getValue("items").map((item) => item.title)).toEqual([
      "z",
      "y",
      "a",
      "b",
      "c",
    ]);
    expect(form.getArrayKeys("items").slice(2, 4)).toEqual([first, second]);
    items.move(2, 0);
    expect(form.getArrayKeys("items")[0]).toBe(first);
    items.swap(0, 1);
    expect(form.getArrayKeys("items")[1]).toBe(first);
    items.remove([1, 0]);
    expect(form.getValue("items").map((item) => item.title)).toEqual([
      "y",
      "b",
      "c",
    ]);
    expect(form.getArrayKeys("items")[1]).toBe(second);
    items.remove(0);
    items.replace([{ title: "n" }]);
    expect(form.getArrayKeys("items")).not.toContain(second);
  });

  test("should move touched state and errors with their rows", async () => {
    const { form } = setup(
      {},
      { ...defaults, items: [{ title: "" }, { title: "ok" }] }
    );
    form.blur("items.1.title" as never);
    await form.handleSubmit();
    expect(form.getState().errors["items.0.title"]).toBe("Başlık gerekli");
    form.setError("items.0.title" as never, "Sunucu");
    form.array("items").move(0, 1);
    expect(form.getState().touched).toEqual({ "items.0.title": true });
    expect(form.getState().errors["items.1.title"]).toBe("Sunucu");
    form.clearErrors("items.1.title" as never);
    form.setValue("items.0.title" as never, "ok" as never);
    expect(form.getState().errors["items.1.title"]).toBe("Başlık gerekli");
  });

  test("should move revealed paths with their rows in change mode", () => {
    const { form } = setup(
      { mode: "change" },
      { ...defaults, items: [{ title: "a" }, { title: "b" }] }
    );
    form.setValue("items.1.title" as never, "" as never);
    expect(form.getState().errors["items.1.title"]).toBe("Başlık gerekli");
    form.array("items").remove(0);
    expect(form.getState().errors).toEqual({
      "items.0.title": "Başlık gerekli",
    });
  });

  test("should start keys for a missing array and renew them when the array is replaced", () => {
    const { form } = setup({}, { ...defaults, items: undefined as never });
    expect(form.getArrayKeys("items")).toEqual([]);
    form.array("items").append({ title: "a" });
    const [key] = form.getArrayKeys("items");
    form.setValue("items", [{ title: "x" }]);
    expect(form.getArrayKeys("items")[0]).not.toBe(key);
  });

  test("should move the keys of nested arrays with their parent row", () => {
    const nested = z.object({
      groups: z.array(z.object({ tags: z.array(z.string()) })),
    });
    const form = createFormStore<z.input<typeof nested>>(
      { groups: [{ tags: ["a"] }, { tags: ["b"] }] },
      () => ({ schema: nested, onSubmit: vi.fn() })
    );
    const [tagOfSecond] = form.getArrayKeys("groups.1.tags");
    form.getArrayKeys("groups.0.tags");
    form.array("groups").move(1, 0);
    expect(form.getArrayKeys("groups.0.tags")[0]).toBe(tagOfSecond);
  });
});

describe("createFormStore: registrations", () => {
  test("should register labels and elements and forget them on unregister", () => {
    const { form } = setup();
    const element = {} as HTMLElement;
    const unregisterFirst = form.registerField("email", {
      getElement: () => null,
    });
    const unregisterSecond = form.registerField("email", {
      getElement: () => element,
      label: "E-posta",
    });
    expect(form.getFieldLabel("email")).toBe("E-posta");
    expect(form.getFieldElement("email")).toBe(element);
    expect(form.getFieldLabel("name")).toBeUndefined();
    expect(form.getFieldElement("name")).toBeNull();
    unregisterSecond();
    expect(form.getFieldLabel("email")).toBeUndefined();
    unregisterFirst();
    expect(form.getFieldElement("email")).toBeNull();
  });

  test("should not let a stale unregister remove a newer registration", () => {
    const { form } = setup();
    const element = {} as HTMLElement;
    const unregister = form.registerField("email", { getElement: () => null });
    unregister();
    form.registerField("email", { getElement: () => element });
    unregister();
    expect(form.getFieldElement("email")).toBe(element);
  });

  test("should report that nothing can be focused without a DOM element", () => {
    const { form } = setup();
    expect(form.focusFirstError()).toBe(false);
    form.setFormError("x");
    const unregister = form.registerSummary(() => null);
    expect(form.focusFirstError()).toBe(false);
    unregister();
    expect(form.focusField("email")).toBe(false);
  });
});
