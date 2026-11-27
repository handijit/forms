import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import createFormStore, {
  type StoreOptions,
} from "../lib/core/create-form-store";
import DEFAULT_MESSAGES from "../lib/constants/default-messages.constants";
import type { FieldValidator, FormApi } from "../lib/types/form.type";

type Options = Omit<StoreOptions, "onSubmit"> & {
  onSubmit?: StoreOptions["onSubmit"];
};

const setup = <TValues>(
  defaultValues: TValues,
  options: Options
): { form: FormApi<TValues>; options: StoreOptions } => {
  const latest: StoreOptions = { onSubmit: vi.fn(), ...options };
  return {
    form: createFormStore(defaultValues, () => latest),
    options: latest,
  };
};

/** Lets every pending promise callback run (a macrotask comes after all of them). */
const flush = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const nullElement = (): null => null;

const profileSchema = z.object({
  name: z.string().min(2, "Ad kısa"),
  email: z.email("E-posta geçersiz"),
  address: z.object({ city: z.string().min(1, "Şehir gerekli") }),
});
type Profile = z.input<typeof profileSchema>;
const PROFILE: Profile = { name: "", email: "", address: { city: "" } };

describe("createFormStore: state and subscriptions", () => {
  test("should start clean", () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    expect(form.getState()).toEqual({
      values: PROFILE,
      defaultValues: PROFILE,
      errors: {},
      formErrors: [],
      touched: {},
      isDirty: false,
      isSubmitting: false,
      isValidating: false,
      isSubmitSuccessful: false,
      submitCount: 0,
    });
    expect(form.getValues()).toBe(PROFILE);
    expect(form.messages).toEqual(DEFAULT_MESSAGES);
  });

  test("should write values immutably and track dirtiness", () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    form.setValue("address.city", "İzmir");
    expect(form.getValue("address.city")).toBe("İzmir");
    expect(PROFILE.address.city).toBe("");
    expect(form.getState().isDirty).toBe(true);
    expect(form.getFieldState("address.city")).toEqual({
      value: "İzmir",
      error: undefined,
      isTouched: false,
      isDirty: true,
      isValidating: false,
      isRequired: true,
    });
    form.setValue("address.city", "");
    expect(form.getState().isDirty).toBe(false);
  });

  test("should notify subscribers with a new snapshot and stop after unsubscribe", () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    const before = form.getState();
    const listener = vi.fn();
    const unsubscribe = form.subscribe(listener);
    form.setValue("name", "Ada");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(form.getState()).not.toBe(before);
    unsubscribe();
    form.setValue("name", "Adam");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("should let a listener unsubscribe another during a notification", () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    const second = vi.fn();
    let unsubscribeSecond = (): void => {};
    form.subscribe(() => unsubscribeSecond());
    unsubscribeSecond = form.subscribe(second);
    form.setValue("name", "Ada");
    expect(second).toHaveBeenCalledTimes(1);
    form.setValue("name", "Adam");
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("should merge message overrides over the defaults", () => {
    const { form } = setup(PROFILE, {
      schema: profileSchema,
      messages: { submitFailed: "Olmadı" },
    });
    expect(form.messages).toEqual({
      ...DEFAULT_MESSAGES,
      submitFailed: "Olmadı",
    });
  });
});

describe("createFormStore: validation timing", () => {
  test("submit mode: should stay silent until the first submit, then follow every change", async () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    form.setValue("name", "A");
    form.blur("name");
    expect(form.getState().errors).toEqual({});
    expect(form.getState().touched).toEqual({ name: true });
    await form.handleSubmit();
    expect(form.getState().errors).toEqual({
      name: "Ad kısa",
      email: "E-posta geçersiz",
      "address.city": "Şehir gerekli",
    });
    form.setValue("name", "Ada");
    expect(form.getState().errors.name).toBeUndefined();
  });

  test("blur mode: should show a field's errors once it was left", () => {
    const { form } = setup(PROFILE, { schema: profileSchema, mode: "blur" });
    form.setValue("name", "A");
    expect(form.getState().errors).toEqual({});
    form.blur("name");
    expect(form.getState().errors).toEqual({ name: "Ad kısa" });
    const listener = vi.fn();
    form.subscribe(listener);
    // Leaving again changes nothing visible.
    form.blur("name");
    expect(listener).not.toHaveBeenCalled();
    // Touching through setValue reveals as well.
    form.setValue("email", "x", { shouldTouch: true });
    expect(form.getState().errors.email).toBe("E-posta geçersiz");
    expect(form.getState().touched.email).toBe(true);
  });

  test("change mode: should show a field's errors as soon as it changes", () => {
    const { form } = setup(PROFILE, { schema: profileSchema, mode: "change" });
    form.setValue("email", "x");
    expect(form.getState().errors).toEqual({ email: "E-posta geçersiz" });
    form.blur("name");
    expect(form.getState().errors).toEqual({
      email: "E-posta geçersiz",
      name: "Ad kısa",
    });
  });

  test("change mode: should keep checking every change after a submit", async () => {
    const { form } = setup(PROFILE, { schema: profileSchema, mode: "change" });
    await form.handleSubmit();
    form.setValue("name", "Ada");
    expect(form.getState().errors.name).toBeUndefined();
    expect(form.getState().errors.email).toBe("E-posta geçersiz");
  });

  test("should check a field on demand with shouldValidate", () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    form.setValue("email", "x", { shouldValidate: true });
    expect(form.getState().errors).toEqual({ email: "E-posta geçersiz" });
  });

  test("should reveal the errors under a revealed parent and show them on the parent", () => {
    const { form } = setup(PROFILE, { schema: profileSchema, mode: "blur" });
    form.blur("address");
    expect(form.getState().errors).toEqual({ "address.city": "Şehir gerekli" });
    expect(form.getFieldState("address").error).toBe("Şehir gerekli");
    expect(form.getFieldState("name").error).toBeUndefined();
  });

  test("should put cross-field issues on their path and root issues at form level", async () => {
    const schema = z
      .object({ password: z.string(), confirm: z.string() })
      .refine((values) => values.password === values.confirm, {
        message: "Şifreler aynı değil",
        path: ["confirm"],
      })
      .refine((values) => values.password !== "123", "Çok zayıf");
    const { form } = setup({ password: "123", confirm: "1" }, { schema });
    await form.handleSubmit();
    expect(form.getState().errors).toEqual({ confirm: "Şifreler aynı değil" });
    expect(form.getState().formErrors).toEqual(["Çok zayıf"]);
  });

  test("should keep root issues hidden until a submit", () => {
    const schema = z.object({ a: z.string() }).refine(() => false, "Kök");
    const { form } = setup({ a: "" }, { schema, mode: "change" });
    form.setValue("a", "x");
    expect(form.getState().formErrors).toEqual([]);
  });
});

describe("createFormStore: async schemas", () => {
  test("should switch to async parsing for good and apply only the latest run", async () => {
    const gates: { value: string; open: () => void }[] = [];
    const schema = z.object({
      name: z.string().refine(async (value) => {
        await new Promise<void>((resolve) =>
          gates.push({ value, open: resolve })
        );
        return value !== "taken";
      }, "Alındı"),
    });
    const { form } = setup({ name: "" }, { schema, mode: "change" });

    form.setValue("name", "taken");
    await flush();
    expect(form.getState().isValidating).toBe(true);
    form.setValue("name", "free");
    await flush();
    // The newer run settles first, then the stale one: only the newer one may write.
    for (const gate of gates.filter(({ value }) => value === "free"))
      gate.open();
    await flush();
    for (const gate of gates.filter(({ value }) => value === "taken"))
      gate.open();
    await flush();
    expect(form.getState().errors).toEqual({});
    expect(form.getState().isValidating).toBe(false);

    form.setValue("name", "taken");
    await flush();
    for (const gate of gates) gate.open();
    await flush();
    expect(form.getState().errors).toEqual({ name: "Alındı" });
  });

  test("should drop a run that a reset made stale", async () => {
    let open = (): void => {};
    const schema = z.object({
      name: z.string().refine(async () => {
        await new Promise<void>((resolve) => {
          open = resolve;
        });
        return false;
      }, "Hata"),
    });
    const { form } = setup({ name: "" }, { schema, mode: "change" });
    form.setValue("name", "x");
    await flush();
    form.reset();
    open();
    await flush();
    expect(form.getState().errors).toEqual({});
  });

  test("should throw a synchronous schema's error from the call that ran it", () => {
    const schema = z.object({
      name: z.string().refine((value) => {
        if (value === "boom") throw new TypeError("schema exploded");
        return true;
      }),
    });
    const { form } = setup({ name: "" }, { schema, mode: "change" });
    expect(() => form.setValue("name", "boom")).toThrow("schema exploded");
  });

  test("should surface an async schema's error instead of losing it in a promise", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const schema = z.object({
      name: z.string().refine(async (value) => {
        if (value === "boom") throw new TypeError("schema exploded");
        return true;
      }),
    });
    const { form } = setup({ name: "" }, { schema, mode: "change" });
    form.setValue("name", "ok");
    await flush();
    form.setValue("name", "boom");
    await flush();
    expect(() => vi.runAllTimers()).toThrow("schema exploded");
    form.setValue("name", "ok", { shouldValidate: true });
    form.blur("name");
    await flush();
    expect(form.getState().isValidating).toBe(false);
  });
});

describe("createFormStore: field validators", () => {
  const schema = z.object({ email: z.email("E-posta geçersiz") });

  test("should run on blur after the schema accepted the field, and show its message", async () => {
    const validate = vi.fn<FieldValidator>(async () => "Kayıtlı");
    const { form } = setup({ email: "" }, { schema, mode: "blur" });
    form.registerField("email", { getElement: nullElement, validate });

    form.setValue("email", "x");
    form.blur("email");
    await flush();
    expect(validate).not.toHaveBeenCalled();
    expect(form.getState().errors).toEqual({ email: "E-posta geçersiz" });

    form.setValue("email", "a@b.co");
    form.blur("email");
    await flush();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(validate.mock.calls[0]?.[0]).toBe("a@b.co");
    expect(validate.mock.calls[0]?.[1].values).toEqual({ email: "a@b.co" });
    expect(form.getState().errors).toEqual({ email: "Kayıtlı" });

    // The same value is not checked twice.
    form.blur("email");
    await flush();
    expect(validate).toHaveBeenCalledTimes(1);
  });

  test("should not run before the first submit in submit mode", async () => {
    const validate = vi.fn<FieldValidator>(() => undefined);
    const { form } = setup({ email: "a@b.co" }, { schema });
    form.registerField("email", { getElement: nullElement, validate });
    form.blur("email");
    await flush();
    expect(validate).not.toHaveBeenCalled();
  });

  test("should abort a running check when the value changes and drop its result", async () => {
    let finish: (message: string) => void = () => undefined;
    let signal: AbortSignal | undefined;
    const validate: FieldValidator = (_value, context) => {
      signal = context.signal;
      return new Promise((resolve) => {
        finish = resolve;
      });
    };
    const { form } = setup({ email: "a@b.co" }, { schema, mode: "blur" });
    form.registerField("email", { getElement: nullElement, validate });
    form.blur("email");
    await flush();
    expect(form.getFieldState("email").isValidating).toBe(true);
    expect(form.getState().isValidating).toBe(true);

    form.setValue("email", "c@d.co");
    expect(signal?.aborted).toBe(true);
    finish("Kayıtlı");
    await flush();
    expect(form.getState().errors).toEqual({});
    expect(form.getState().isValidating).toBe(false);
  });

  test("should restart a running check on a second blur and keep only the newest result", async () => {
    const finishers: ((message: string | undefined) => void)[] = [];
    const validate: FieldValidator = () =>
      new Promise((resolve) => {
        finishers.push(resolve);
      });
    const { form } = setup({ email: "a@b.co" }, { schema, mode: "blur" });
    form.registerField("email", { getElement: nullElement, validate });
    form.blur("email");
    await flush();
    form.blur("email");
    await flush();
    expect(finishers).toHaveLength(2);
    finishers[1]?.(undefined);
    await flush();
    finishers[0]?.("Eski sonuç");
    await flush();
    expect(form.getState().errors).toEqual({});
  });

  test("should not block the form when a check throws, and rethrow its error", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const validate: FieldValidator = () => Promise.reject(new Error("offline"));
    const { form } = setup({ email: "a@b.co" }, { schema, mode: "blur" });
    form.registerField("email", { getElement: nullElement, validate });
    form.blur("email");
    await flush();
    expect(form.getState().errors).toEqual({});
    expect(() => vi.runAllTimers()).toThrow("offline");
  });

  test("should forget validator results on changes, clears, resets and array operations", async () => {
    const schema = z.object({
      a: z.string(),
      b: z.string(),
      c: z.string(),
      items: z.array(z.string()),
    });
    const pending: {
      resolve: (message: string | undefined) => void;
      reject: (error: Error) => void;
    }[] = [];
    const { form } = setup(
      { a: "x", b: "y", c: "z", items: [] as string[] },
      { schema, mode: "blur" }
    );
    form.registerField("a", {
      getElement: nullElement,
      validate: () => "A hatalı",
    });
    form.registerField("b", {
      getElement: nullElement,
      validate: () =>
        new Promise((resolve, reject) => {
          pending.push({ resolve, reject });
        }),
    });
    form.registerField("c", {
      getElement: nullElement,
      validate: () => undefined,
    });
    form.blur("a");
    form.blur("c");
    await flush();
    expect(form.getState().errors).toEqual({ a: "A hatalı" });
    form.blur("b");
    await flush();
    // b settles while a's error stands.
    pending[0]?.resolve(undefined);
    await flush();
    expect(form.getState().errors).toEqual({ a: "A hatalı" });
    form.setValue("b", "w");
    form.blur("b");
    await flush();
    // Changing a forgets a's result only: b keeps running, c keeps its result.
    form.setValue("a", "q");
    expect(form.getFieldState("b").isValidating).toBe(true);
    expect(form.getState().errors).toEqual({});
    // b's second run goes stale; its late failure is dropped silently.
    form.setValue("b", "v");
    pending[1]?.reject(new Error("geç kaldı"));
    await flush();
    form.array("items").append("1");
    form.clearErrors();
    form.blur("c");
    await flush();
    form.reset();
    expect(form.getState().isValidating).toBe(false);
    expect(form.getState().errors).toEqual({});
  });

  test("should block the submit with a validator's message", async () => {
    const onSubmit = vi.fn();
    const { form } = setup({ email: "a@b.co" }, { schema, onSubmit });
    form.registerField("email", {
      getElement: nullElement,
      validate: () => "Kayıtlı",
    });
    await form.handleSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(form.getState().errors).toEqual({ email: "Kayıtlı" });
  });
});

describe("createFormStore: submit", () => {
  const schema = z.object({
    name: z.string().min(2, "Ad kısa"),
    age: z.string().transform((value) => Number(value)),
  });

  test("should submit the parsed values with the helpers and make them the baseline", async () => {
    const onSubmit = vi.fn();
    const { form } = setup({ name: "", age: "1" }, { schema, onSubmit });
    form.setValue("name", "Ada");
    const preventDefault = vi.fn();
    const submitting = form.handleSubmit({ preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(form.getState().isSubmitting).toBe(true);
    await submitting;
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ name: "Ada", age: 1 });
    expect(Object.keys(onSubmit.mock.calls[0]?.[1] ?? {}).sort()).toEqual([
      "applyServerErrors",
      "reset",
      "setError",
      "setFormError",
    ]);
    expect(form.getState()).toMatchObject({
      isSubmitting: false,
      isSubmitSuccessful: true,
      isDirty: false,
      submitCount: 1,
      defaultValues: { name: "Ada", age: "1" },
    });
  });

  test("should report a failed validation and not submit", async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const { form } = setup(
      { name: "", age: "1" },
      { schema, onSubmit, onInvalid }
    );
    await form.handleSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid).toHaveBeenCalledWith({ name: "Ad kısa" }, []);
    expect(form.getState()).toMatchObject({
      isSubmitting: false,
      isSubmitSuccessful: false,
      submitCount: 1,
    });
  });

  test("should ignore a second submit while one is running", async () => {
    let finish = (): void => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const { form } = setup({ name: "Ada", age: "1" }, { schema, onSubmit });
    const first = form.handleSubmit();
    await flush();
    await form.handleSubmit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(form.getState().isSubmitting).toBe(true);
    finish();
    await first;
    expect(form.getState().isSubmitting).toBe(false);
  });

  test("should keep the baseline onSubmit chose with reset", async () => {
    const { form } = setup(
      { name: "Ada", age: "1" },
      {
        schema,
        onSubmit: (_values, helpers) =>
          (helpers as { reset: FormApi<unknown>["reset"] }).reset({
            name: "Yeni",
            age: "2",
          }),
      }
    );
    form.setValue("name", "Adam");
    await form.handleSubmit();
    expect(form.getState().values).toEqual({ name: "Yeni", age: "2" });
    expect(form.getState().defaultValues).toEqual({ name: "Yeni", age: "2" });
  });

  test("should not call a submit successful when onSubmit applied server errors", async () => {
    const { form } = setup(
      { name: "Ada", age: "1" },
      {
        schema,
        onSubmit: (_values, helpers) =>
          (helpers as { setFormError: (message: string) => void }).setFormError(
            "Reddedildi"
          ),
      }
    );
    form.setValue("name", "Adam");
    await form.handleSubmit();
    expect(form.getState()).toMatchObject({
      isSubmitSuccessful: false,
      isDirty: true,
      formErrors: ["Reddedildi"],
    });
  });

  test("should show submitFailed when onSubmit throws", async () => {
    const { form } = setup(
      { name: "Ada", age: "1" },
      {
        schema,
        onSubmit: () => Promise.reject(new Error("network")),
        messages: { submitFailed: "Gönderilemedi" },
      }
    );
    await form.handleSubmit();
    expect(form.getState().formErrors).toEqual(["Gönderilemedi"]);
    expect(form.getState().isSubmitSuccessful).toBe(false);
  });

  test("should hand a thrown error to onSubmitError instead", async () => {
    const error = new Error("network");
    const onSubmitError = vi.fn();
    const { form } = setup(
      { name: "Ada", age: "1" },
      { schema, onSubmit: () => Promise.reject(error), onSubmitError }
    );
    await form.handleSubmit();
    expect(onSubmitError).toHaveBeenCalledTimes(1);
    expect(onSubmitError.mock.calls[0]?.[0]).toBe(error);
    expect(form.getState().formErrors).toEqual([]);
  });

  test("should clear server errors when a new submit starts", async () => {
    const { form } = setup({ name: "Ada", age: "1" }, { schema });
    form.setFormError("Eski");
    form.setError("name", "Sunucu");
    await form.handleSubmit();
    expect(form.getState().formErrors).toEqual([]);
    expect(form.getState().errors).toEqual({});
  });

  test("should read the latest options on every submit", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { form, options } = setup(
      { name: "Ada", age: "1" },
      { schema, onSubmit: first }
    );
    options.onSubmit = second;
    await form.handleSubmit();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("should validate on demand, revealing every error", async () => {
    const { form } = setup({ name: "", age: "1" }, { schema });
    await expect(form.validate()).resolves.toBe(false);
    expect(form.getState().errors).toEqual({ name: "Ad kısa" });
    expect(form.getState().submitCount).toBe(0);
    form.setValue("name", "Ada");
    await expect(form.validate()).resolves.toBe(true);
  });

  test("should count root issues against validity", async () => {
    const root = z.object({ a: z.string() }).refine(() => false, "Kök");
    const { form } = setup({ a: "" }, { schema: root });
    await expect(form.validate()).resolves.toBe(false);
    expect(form.getState().formErrors).toEqual(["Kök"]);
  });
});

describe("createFormStore: server and manual errors", () => {
  const schema = z.object({
    email: z.string(),
    items: z.array(z.object({ title: z.string() })),
  });
  const values = { email: "", items: [{ title: "" }] };

  const onScreen = (form: FormApi<typeof values>): void => {
    form.registerField("email", { getElement: nullElement });
    form.registerField("items", { getElement: nullElement });
  };

  test("should mark every listed field of a problem with its detail", () => {
    const { form } = setup(values, { schema });
    onScreen(form);
    form.applyServerErrors({
      status: 400,
      detail: "Geçersiz",
      fields: ["email", "items[0].title", "unknown"],
    });
    expect(form.getState().errors).toEqual({
      email: "Geçersiz",
      "items.0.title": "Geçersiz",
    });
    expect(form.getState().formErrors).toEqual(["Geçersiz"]);
  });

  test("should take a message per field from a problem's fields map", () => {
    const { form } = setup(values, { schema });
    onScreen(form);
    form.applyServerErrors({
      status: 422,
      title: "Başlık",
      fields: { email: ["", "Kayıtlı"], "/items/0/title": null },
    });
    expect(form.getState().errors).toEqual({
      email: "Kayıtlı",
      "items.0.title": "Başlık",
    });
  });

  test("should fall back to the default message and to form level", () => {
    const { form } = setup(values, { schema });
    form.applyServerErrors({ status: 409 });
    expect(form.getState().formErrors).toEqual([
      DEFAULT_MESSAGES.serverFieldError,
    ]);
    form.applyServerErrors({ status: 400, detail: "Bozuk", fields: [] });
    expect(form.getState().formErrors).toEqual([
      DEFAULT_MESSAGES.serverFieldError,
      "Bozuk",
    ]);
  });

  test("should accept a plain message map, the empty key being the form", () => {
    const { form } = setup(values, { schema });
    onScreen(form);
    form.applyServerErrors({
      email: "Kayıtlı",
      "": "Kayıt değişti",
      items: undefined,
    });
    expect(form.getState().errors).toEqual({ email: "Kayıtlı" });
    expect(form.getState().formErrors).toEqual(["Kayıt değişti"]);
  });

  test("should clear a server error when its field changes", () => {
    const { form } = setup(values, { schema });
    onScreen(form);
    form.applyServerErrors({ email: "Kayıtlı", "items.0.title": "Boş" });
    form.setValue("email", "a@b.co");
    expect(form.getState().errors).toEqual({ "items.0.title": "Boş" });
    form.setValue("items", [{ title: "x" }]);
    expect(form.getState().errors).toEqual({});
  });

  test("should set, add and clear manual errors", () => {
    const { form } = setup(values, { schema });
    form.setError("email", "Elle");
    form.setFormError("Form");
    form.setFormError("Form");
    expect(form.getState().errors).toEqual({ email: "Elle" });
    expect(form.getState().formErrors).toEqual(["Form"]);
    form.clearErrors("email");
    expect(form.getState().errors).toEqual({});
    form.setError("email", "Elle");
    form.clearErrors();
    expect(form.getState().errors).toEqual({});
    expect(form.getState().formErrors).toEqual([]);
  });

  test("should clear the schema's errors of a field too", async () => {
    const strict = z.object({ email: z.email("E-posta geçersiz") });
    const { form } = setup({ email: "" }, { schema: strict });
    await form.handleSubmit();
    expect(form.getState().errors).toEqual({ email: "E-posta geçersiz" });
    form.clearErrors("email");
    expect(form.getState().errors).toEqual({});
  });
});

describe("createFormStore: reset", () => {
  test("should go back to the defaults and forget everything else", async () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    form.setValue("name", "A");
    form.blur("name");
    await form.handleSubmit();
    form.reset();
    expect(form.getState()).toMatchObject({
      values: PROFILE,
      errors: {},
      touched: {},
      submitCount: 0,
      isDirty: false,
    });
  });

  test("should make new values the baseline", () => {
    const { form } = setup(PROFILE, { schema: profileSchema });
    const next = { name: "Ada", email: "a@b.co", address: { city: "İzmir" } };
    form.reset(next);
    expect(form.getState().values).toEqual(next);
    expect(form.getState().defaultValues).toEqual(next);
    form.setValue("name", "x");
    form.reset();
    expect(form.getState().values).toEqual(next);
  });
});

describe("createFormStore: arrays", () => {
  const schema = z.object({
    items: z
      .array(z.object({ title: z.string().min(1, "Başlık gerekli") }))
      .min(1, "En az bir satır"),
    tags: z.array(z.string()),
  });
  const rows = (...titles: string[]): { title: string }[] =>
    titles.map((title) => ({ title }));

  test("should keep a key per row through every operation", () => {
    const { form } = setup(
      { items: rows("a", "b", "c"), tags: [] },
      { schema }
    );
    const [a, b, c] = form.getArrayKeys("items");
    expect(form.getArrayKeys("items")).toEqual([a, b, c]);
    const items = form.array("items");
    expect(form.array("items")).toBe(items);

    items.move(0, 2);
    expect(form.getValue("items")).toEqual(rows("b", "c", "a"));
    expect(form.getArrayKeys("items")).toEqual([b, c, a]);
    items.swap(0, 1);
    expect(form.getArrayKeys("items")).toEqual([c, b, a]);
    items.remove(1);
    expect(form.getArrayKeys("items")).toEqual([c, a]);
    items.append({ title: "d" });
    items.prepend({ title: "e" });
    items.insert(1, { title: "f" });
    expect(form.getValue("items")).toEqual(rows("e", "f", "c", "a", "d"));
    const keys = form.getArrayKeys("items");
    expect(new Set(keys).size).toBe(5);
    expect(keys.slice(2, 4)).toEqual([c, a]);
    items.remove([0, 1]);
    expect(form.getArrayKeys("items").slice(0, 2)).toEqual([c, a]);
    items.replace(rows("z"));
    expect(form.getValue("items")).toEqual(rows("z"));
    expect(form.getArrayKeys("items")).not.toContain(c);
  });

  test("should move touched state and errors with their rows", async () => {
    const { form } = setup({ items: rows("", "b"), tags: [] }, { schema });
    form.blur("items.0.title");
    await form.handleSubmit();
    expect(form.getState().errors).toEqual({
      "items.0.title": "Başlık gerekli",
    });
    form.array("items").move(0, 1);
    expect(form.getState().touched).toEqual({ "items.1.title": true });
    expect(form.getState().errors).toEqual({
      "items.1.title": "Başlık gerekli",
    });
    form.array("items").remove(1);
    expect(form.getState().errors).toEqual({});
  });

  test("should move what blur mode revealed with its row", () => {
    const { form } = setup(
      { items: rows("", "b"), tags: [] },
      { schema, mode: "blur" }
    );
    form.blur("items.0.title");
    form.array("items").prepend({ title: "x" });
    expect(form.getState().errors).toEqual({
      "items.1.title": "Başlık gerekli",
    });
  });

  test("should reveal the array's own error in change mode and clear its server error", () => {
    const { form } = setup(
      { items: rows("a"), tags: [] },
      { schema, mode: "change" }
    );
    form.registerField("items", { getElement: nullElement });
    form.applyServerErrors({ items: "Sunucu" });
    form.array("items").remove(0);
    expect(form.getState().errors).toEqual({ items: "En az bir satır" });
    expect(form.getFieldState("items").error).toBe("En az bir satır");
  });

  test("should treat a missing array as empty and new keys after an outside write", () => {
    const { form } = setup(
      { items: rows("a"), tags: undefined as unknown as string[] },
      { schema }
    );
    expect(form.getArrayKeys("tags")).toEqual([]);
    form.array("tags").append("x");
    expect(form.getValue("tags")).toEqual(["x"]);
    const [first] = form.getArrayKeys("items");
    form.setValue("items", rows("a", "b"));
    expect(form.getArrayKeys("items")).toHaveLength(2);
    expect(form.getArrayKeys("items")).not.toContain(first);
  });

  test("should keep row keys when a field inside a row changes", () => {
    const { form } = setup({ items: rows("a"), tags: [] }, { schema });
    const keys = form.getArrayKeys("items");
    form.setValue("items.0.title", "b");
    expect(form.getArrayKeys("items")).toBe(keys);
  });

  test("should move the keys of nested arrays with their parent row", () => {
    const nested = z.object({
      groups: z.array(z.object({ lines: z.array(z.string()) })),
    });
    const { form } = setup(
      { groups: [{ lines: ["a"] }, { lines: ["b"] }] },
      { schema: nested }
    );
    const [line] = form.getArrayKeys("groups.1.lines");
    form.array("groups").move(1, 0);
    expect(form.getArrayKeys("groups.0.lines")).toEqual([line]);
  });
});

describe("createFormStore: registrations", () => {
  const schema = z.object({ email: z.string().min(1), note: z.string() });

  test("should derive and cache required state per schema", () => {
    const { form, options } = setup({ email: "", note: "" }, { schema });
    expect(form.getFieldState("email").isRequired).toBe(true);
    expect(form.getFieldState("email").isRequired).toBe(true);
    expect(form.getFieldState("note").isRequired).toBe(false);
    options.schema = z.object({ email: z.string(), note: z.string() });
    expect(form.getFieldState("email").isRequired).toBe(false);
  });

  test("should keep labels and elements per field until every registration is gone", () => {
    const { form } = setup({ email: "", note: "" }, { schema });
    const first = form.registerField("email", { getElement: nullElement });
    const second = form.registerField("email", {
      getElement: nullElement,
      label: "E-posta",
    });
    expect(form.getFieldLabel("email")).toBe("E-posta");
    expect(form.getFieldElement("email")).toBeNull();
    second();
    expect(form.getFieldLabel("email")).toBeUndefined();
    first();
    first();
    expect(form.getFieldLabel("email")).toBeUndefined();
    expect(form.getFieldLabel("note")).toBeUndefined();
  });

  test("should keep a newer registration when an older one leaves", () => {
    const { form } = setup({ email: "", note: "" }, { schema });
    const old = form.registerField("email", { getElement: nullElement });
    old();
    form.registerField("email", { getElement: nullElement, label: "Yeni" });
    old();
    expect(form.getFieldLabel("email")).toBe("Yeni");
  });

  test("should report that nothing could take the focus without a DOM", async () => {
    vi.useFakeTimers();
    const { form } = setup({ email: "", note: "" }, { schema });
    form.registerField("email", { getElement: nullElement });
    const unregister = form.registerSummary(nullElement);
    expect(form.focusFirstError()).toBe(false);
    await form.handleSubmit();
    vi.runAllTimers();
    expect(form.focusFirstError()).toBe(false);
    expect(form.focusField("email")).toBe(false);
    unregister();
  });
});
