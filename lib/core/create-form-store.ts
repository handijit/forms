import type { $ZodType } from "zod/v4/core";

import DEFAULT_MESSAGES from "../constants/default-messages.constants";
import {
  changeArray,
  moveKeys,
  type ArrayOperation,
} from "../helpers/array-change.helper";
import {
  afterPaint,
  byDocumentOrder,
  focusTarget,
  revealAndFocus,
} from "../helpers/dom.helper";
import isDeepEqual from "../helpers/is-deep-equal.helper";
import {
  getPath,
  isRelated,
  isWithin,
  normalizeServerPath,
  setPath,
} from "../helpers/path.helper";
import {
  isRequiredSchema,
  runSchema,
  schemaAt,
  type Validation,
} from "../helpers/schema.helper";
import type {
  FieldArrayApi,
  FieldErrorMap,
  FieldRegistration,
  FieldValues,
  FieldState,
  FieldValidator,
  FormApi,
  FormMessages,
  FormMode,
  FormState,
  ProblemDetails,
  SubmitHelpers,
} from "../types/form.type";

/** What the store reads from the latest render of `useForm`. */
export type StoreOptions = {
  schema: $ZodType;
  mode?: FormMode;
  messages?: Partial<FormMessages>;
  onSubmit: (values: never, helpers: SubmitHelpers<never>) => unknown;
  onInvalid?: (
    errors: FormState<unknown>["errors"],
    formErrors: readonly string[]
  ) => void;
  onSubmitError?: (error: unknown, helpers: SubmitHelpers<never>) => void;
};

type Errors = Record<string, string>;

const without = <T>(
  record: Readonly<Record<string, T>>,
  drop: (key: string) => boolean
): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([key]) => !drop(key)));

const unique = (messages: readonly string[]): string[] => [
  ...new Set(messages),
];

const firstMessage = (
  value: string | readonly string[] | null | undefined
): string | undefined =>
  (typeof value === "string" ? [value] : (value ?? [])).find(
    (message) => message !== ""
  );

/**
 * The framework-free core of a form: values, errors, touched state, submission and array
 * operations behind a subscribe/getState pair that `useSyncExternalStore` reads. One store per
 * `useForm` call; nothing is shared between stores.
 */
const createFormStore = <TValues>(
  defaultValues: TValues,
  readOptions: () => StoreOptions
): FormApi<TValues> => {
  let baseline = defaultValues;
  let values = defaultValues;
  let defaults = defaultValues;

  // Schema results: everything the schema says; `revealed` decides what is shown.
  let schemaErrors: Errors = {};
  let schemaFormErrors: string[] = [];
  // `null` once a submit has revealed every path.
  let revealed: Set<string> | null = new Set();
  // Server and manual errors: always shown, cleared when their field changes.
  let externalErrors: Errors = {};
  let externalFormErrors: string[] = [];
  // Field validator results.
  let validatorErrors: Errors = {};
  let touched: Record<string, true> = {};

  let submitCount = 0;
  let resetCount = 0;
  let isSubmitting = false;
  let isSubmitSuccessful = false;
  let schemaIsAsync = false;
  let schemaRun = 0;
  let pendingSchemaRuns = 0;
  let validatorRun = 0;
  const validatorRuns = new Map<
    string,
    { controller: AbortController; run: number }
  >();
  const validatedValues = new Map<string, unknown>();

  const registrations = new Map<string, Set<FieldRegistration>>();
  const summaries = new Set<() => HTMLElement | null>();
  let arrayKeys = new Map<string, string[]>();
  let keyCount = 0;
  const requiredBySchema = new WeakMap<$ZodType, Map<string, boolean>>();
  const arrayApis = new Map<string, FieldArrayApi<TValues, never>>();
  const listeners = new Set<() => void>();

  const messages = (): FormMessages => ({
    ...DEFAULT_MESSAGES,
    ...readOptions().messages,
  });
  const mode = (): FormMode => readOptions().mode ?? "submit";

  const isRevealed = (path: string): boolean =>
    revealed === null || [...revealed].some((root) => isWithin(path, root));

  const build = (): FormState<TValues> => {
    const errors: Errors = { ...validatorErrors };
    for (const [path, message] of Object.entries(schemaErrors)) {
      if (isRevealed(path)) errors[path] = message;
    }
    Object.assign(errors, externalErrors);
    return {
      values,
      defaultValues: defaults,
      errors,
      formErrors: unique([
        ...externalFormErrors,
        ...(revealed === null ? schemaFormErrors : []),
      ]),
      touched,
      isDirty: !isDeepEqual(values, defaults),
      isSubmitting,
      isValidating: pendingSchemaRuns > 0 || validatorRuns.size > 0,
      isSubmitSuccessful,
      submitCount,
    };
  };

  let state = build();

  const emit = (): void => {
    state = build();
    for (const listener of [...listeners]) listener();
  };

  const reveal = (path: string): void => {
    if (revealed !== null) revealed.add(path);
  };

  const applySchema = (validation: Validation): void => {
    schemaErrors = validation.errors;
    schemaFormErrors = validation.formErrors;
  };

  /** Checks the whole form; only the latest run may write its result. */
  const checkSchema = (): Promise<Validation> => {
    schemaRun += 1;
    const run = schemaRun;
    const result = runSchema(readOptions().schema, values, schemaIsAsync);
    if (!(result instanceof Promise)) {
      applySchema(result);
      return Promise.resolve(result);
    }
    schemaIsAsync = true;
    pendingSchemaRuns += 1;
    return result
      .finally(() => {
        pendingSchemaRuns -= 1;
      })
      .then((validation) => {
        if (run === schemaRun) applySchema(validation);
        emit();
        return validation;
      });
  };

  const shouldCheck = (): boolean => submitCount > 0 || mode() !== "submit";

  const validatorOf = (path: string): FieldValidator | undefined =>
    [...(registrations.get(path) ?? [])].find(
      (registration) => registration.validate !== undefined
    )?.validate;

  const cancelValidators = (matches: (path: string) => boolean): void => {
    for (const [path, { controller }] of validatorRuns) {
      if (!matches(path)) continue;
      controller.abort();
      validatorRuns.delete(path);
    }
    validatorErrors = without(validatorErrors, matches);
    for (const path of [...validatedValues.keys()]) {
      if (matches(path)) validatedValues.delete(path);
    }
  };

  /** Runs the field validator of `path`; a newer run or a change makes the result stale. */
  const runValidator = (path: string): Promise<boolean> => {
    const validate = validatorOf(path);
    const value = getPath(values, path);
    if (
      validate === undefined ||
      Object.hasOwn(schemaErrors, path) ||
      (validatedValues.has(path) &&
        isDeepEqual(validatedValues.get(path), value) &&
        !validatorRuns.has(path))
    ) {
      return Promise.resolve(!Object.hasOwn(validatorErrors, path));
    }
    validatorRuns.get(path)?.controller.abort();
    const controller = new AbortController();
    validatorRun += 1;
    const run = validatorRun;
    validatorRuns.set(path, { controller, run });
    emit();
    const settle = (message: string | null | undefined): boolean => {
      if (validatorRuns.get(path)?.run !== run) {
        return !Object.hasOwn(validatorErrors, path);
      }
      validatorRuns.delete(path);
      validatedValues.set(path, value);
      validatorErrors = without(validatorErrors, (key) => key === path);
      if (message) validatorErrors[path] = message;
      emit();
      return !message;
    };
    return Promise.resolve()
      .then(() =>
        validate(value, {
          values: values as unknown as FieldValues,
          signal: controller.signal,
        })
      )
      .then(settle, () => settle(undefined));
  };

  const fail = (error: unknown): void => {
    // A schema that throws is a programming error; it must surface, not vanish in a promise.
    setTimeout(() => {
      throw error;
    }, 0);
  };

  const checkAfterChange = (): void => {
    if (shouldCheck()) checkSchema().catch(fail);
  };

  const clearExternal = (path: string): void => {
    externalErrors = without(externalErrors, (key) => isRelated(key, path));
  };

  const setValue: FormApi<TValues>["setValue"] = (name, value, options) => {
    values = setPath(values, name, value);
    clearExternal(name);
    cancelValidators((path) => isRelated(path, name));
    for (const path of [...arrayKeys.keys()]) {
      if (isWithin(path, name)) arrayKeys.delete(path);
    }
    if (options?.shouldTouch === true) touched = { ...touched, [name]: true };
    if (
      mode() === "change" ||
      options?.shouldValidate === true ||
      (options?.shouldTouch === true && mode() === "blur")
    ) {
      reveal(name);
    }
    if (options?.shouldValidate === true) checkSchema().catch(fail);
    else checkAfterChange();
    emit();
  };

  const blur: FormApi<TValues>["blur"] = (name) => {
    const wasTouched = Object.hasOwn(touched, name);
    if (!wasTouched) touched = { ...touched, [name]: true };
    const revealsNow = mode() !== "submit" && !isRevealed(name);
    if (revealsNow) reveal(name);
    // The validator skips a value it has already checked, so leaving a field twice is free.
    if (shouldCheck()) {
      checkSchema()
        .then(() => runValidator(name))
        .catch(fail);
    }
    if (!wasTouched || revealsNow) emit();
  };

  const keysFor = (path: string): string[] => {
    const current = getPath(values, path);
    const length = Array.isArray(current) ? current.length : 0;
    const known = arrayKeys.get(path) ?? [];
    if (arrayKeys.has(path) && known.length === length) return known;
    const keys = [...known.slice(0, length)];
    while (keys.length < length) {
      keyCount += 1;
      keys.push(`row-${keyCount}`);
    }
    arrayKeys.set(path, keys);
    return keys;
  };

  const changeArrayAt = (path: string, operation: ArrayOperation): void => {
    const current = getPath(values, path);
    const { next, moved } = changeArray(
      Array.isArray(current) ? current : [],
      operation
    );
    const oldKeys = keysFor(path);
    const newKeys: (string | undefined)[] = Array.from({ length: next.length });
    oldKeys.forEach((key, index) => {
      const to = moved(index);
      if (to !== null) newKeys[to] = key;
    });

    values = setPath(values, path, next);
    touched = moveKeys(touched, path, moved);
    schemaErrors = moveKeys(schemaErrors, path, moved);
    validatorErrors = moveKeys(validatorErrors, path, moved);
    externalErrors = without(moveKeys(externalErrors, path, moved), (key) =>
      isWithin(path, key)
    );
    if (revealed !== null) {
      revealed = new Set(
        Object.keys(
          moveKeys(
            Object.fromEntries([...revealed].map((key) => [key, true])),
            path,
            moved
          )
        )
      );
    }
    cancelValidators((key) => isWithin(key, path));
    const nested = moveKeys(
      Object.fromEntries([...arrayKeys].filter(([key]) => key !== path)),
      path,
      moved
    );
    arrayKeys = new Map(Object.entries(nested));
    arrayKeys.set(
      path,
      newKeys.map((key) => {
        if (key !== undefined) return key;
        keyCount += 1;
        return `row-${keyCount}`;
      })
    );
    if (mode() === "change") reveal(path);
    checkAfterChange();
    emit();
  };

  const elementOf = (name: string): HTMLElement | null => {
    for (const { getElement } of registrations.get(name) ?? []) {
      const element = getElement();
      if (element !== null) return element;
    }
    return null;
  };

  const isKnownField = (path: string): boolean =>
    [...registrations.keys()].some((name) => isWithin(path, name));

  const focusFirstError = (): boolean => {
    const errorPaths = Object.keys(state.errors);
    const targets: HTMLElement[] = [];
    for (const [name, entries] of registrations) {
      if (!errorPaths.some((path) => isRelated(path, name))) continue;
      for (const { getElement } of entries) {
        const element = getElement();
        const target = element === null ? null : focusTarget(element);
        if (target !== null) targets.push(target);
      }
    }
    const [first] = targets.sort(byDocumentOrder);
    if (first !== undefined) {
      revealAndFocus(first);
      return true;
    }
    if (errorPaths.length === 0 && state.formErrors.length === 0) return false;
    for (const getElement of summaries) {
      const summary = getElement();
      if (summary !== null) {
        revealAndFocus(summary);
        return true;
      }
    }
    return false;
  };

  const applyServerErrors: FormApi<TValues>["applyServerErrors"] = (input) => {
    const fieldMessages: Errors = {};
    const formMessages: string[] = [];
    const take = (map: FieldErrorMap, fallback?: string): void => {
      for (const [name, value] of Object.entries(map)) {
        const message = firstMessage(value) ?? fallback;
        if (message === undefined) continue;
        const path = normalizeServerPath(name);
        if (path === "") formMessages.push(message);
        else fieldMessages[path] = message;
      }
    };
    if (typeof (input as Partial<ProblemDetails>).status === "number") {
      const problem = input as ProblemDetails;
      const message =
        problem.detail ?? problem.title ?? messages().serverFieldError;
      const { fields } = problem;
      if (Array.isArray(fields)) {
        take(
          Object.fromEntries(
            (fields as readonly string[]).map((name) => [name, message])
          )
        );
      } else if (fields !== undefined) {
        take(fields as FieldErrorMap, message);
      }
      if (Object.keys(fieldMessages).length === 0) formMessages.push(message);
    } else {
      take(input as FieldErrorMap);
    }
    for (const [path, message] of Object.entries(fieldMessages)) {
      if (isKnownField(path))
        externalErrors = { ...externalErrors, [path]: message };
      else formMessages.push(message);
    }
    externalFormErrors = unique([...externalFormErrors, ...formMessages]);
    isSubmitSuccessful = false;
    emit();
    afterPaint(focusFirstError);
  };

  const setError: FormApi<TValues>["setError"] = (name, message) => {
    externalErrors = { ...externalErrors, [name]: message };
    emit();
  };

  const setFormError: FormApi<TValues>["setFormError"] = (message) => {
    externalFormErrors = unique([...externalFormErrors, message]);
    emit();
  };

  const clearErrors: FormApi<TValues>["clearErrors"] = (name) => {
    if (name === undefined) {
      schemaErrors = {};
      schemaFormErrors = [];
      externalErrors = {};
      externalFormErrors = [];
      cancelValidators(() => true);
    } else {
      const matches = (path: string): boolean => isWithin(path, name);
      schemaErrors = without(schemaErrors, matches);
      externalErrors = without(externalErrors, matches);
      cancelValidators(matches);
    }
    emit();
  };

  const reset: FormApi<TValues>["reset"] = (next) => {
    resetCount += 1;
    if (next !== undefined) baseline = next as TValues;
    values = baseline;
    defaults = baseline;
    schemaErrors = {};
    schemaFormErrors = [];
    externalErrors = {};
    externalFormErrors = [];
    cancelValidators(() => true);
    touched = {};
    revealed = new Set();
    submitCount = 0;
    isSubmitSuccessful = false;
    schemaRun += 1;
    arrayKeys = new Map();
    emit();
  };

  /** Schema first, then the field validators of the fields the schema accepted. */
  const checkAll = async (): Promise<Validation & { isValid: boolean }> => {
    const validation = await checkSchema();
    const results = await Promise.all(
      [...registrations.keys()].map((path) => runValidator(path))
    );
    return {
      ...validation,
      isValid:
        Object.keys(validation.errors).length === 0 &&
        validation.formErrors.length === 0 &&
        results.every(Boolean),
    };
  };

  const validate: FormApi<TValues>["validate"] = async () => {
    revealed = null;
    const { isValid } = await checkAll();
    emit();
    return isValid;
  };

  const helpers = (): SubmitHelpers<TValues> => ({
    applyServerErrors,
    setError,
    setFormError,
    reset,
  });

  const handleSubmit: FormApi<TValues>["handleSubmit"] = async (event) => {
    event?.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    isSubmitSuccessful = false;
    submitCount += 1;
    revealed = null;
    externalErrors = {};
    externalFormErrors = [];
    emit();
    const submitted = values;
    const options = readOptions();
    try {
      const { isValid, data } = await checkAll();
      if (!isValid) {
        isSubmitting = false;
        emit();
        afterPaint(focusFirstError);
        options.onInvalid?.(state.errors, state.formErrors);
        return;
      }
      const resetsBefore = resetCount;
      try {
        await options.onSubmit(
          data as never,
          helpers() as unknown as SubmitHelpers<never>
        );
        isSubmitSuccessful =
          Object.keys(externalErrors).length === 0 &&
          externalFormErrors.length === 0;
        // What was sent is what is saved: the new baseline for `isDirty`, unless `onSubmit`
        // already chose one with `reset`.
        if (isSubmitSuccessful && resetCount === resetsBefore) {
          defaults = submitted;
        }
      } catch (error) {
        if (options.onSubmitError === undefined) {
          externalFormErrors = unique([
            ...externalFormErrors,
            messages().submitFailed,
          ]);
          afterPaint(focusFirstError);
        } else {
          options.onSubmitError(
            error,
            helpers() as unknown as SubmitHelpers<never>
          );
        }
      }
    } finally {
      isSubmitting = false;
      emit();
    }
  };

  const array = <P extends string>(name: P): FieldArrayApi<TValues, never> => {
    const known = arrayApis.get(name);
    if (known !== undefined) return known;
    const length = (): number => keysFor(name).length;
    const api: FieldArrayApi<TValues, never> = {
      append: (item) =>
        changeArrayAt(name, { type: "insert", index: length(), item }),
      prepend: (item) =>
        changeArrayAt(name, { type: "insert", index: 0, item }),
      insert: (index, item) =>
        changeArrayAt(name, { type: "insert", index, item }),
      remove: (index) =>
        changeArrayAt(name, {
          type: "remove",
          indexes: typeof index === "number" ? [index] : index,
        }),
      move: (from, to) => changeArrayAt(name, { type: "move", from, to }),
      swap: (a, b) => changeArrayAt(name, { type: "swap", a, b }),
      replace: (items) => changeArrayAt(name, { type: "replace", items }),
    };
    arrayApis.set(name, api);
    return api;
  };

  const isRequired = (name: string): boolean => {
    const { schema } = readOptions();
    const cache = requiredBySchema.get(schema) ?? new Map<string, boolean>();
    requiredBySchema.set(schema, cache);
    const known = cache.get(name);
    if (known !== undefined) return known;
    const result = isRequiredSchema(schemaAt(schema, name));
    cache.set(name, result);
    return result;
  };

  const getFieldState = (name: string): FieldState<unknown> => {
    const value = getPath(state.values, name);
    const own = state.errors[name];
    const error =
      own ??
      Object.entries(state.errors).find(([path]) =>
        path.startsWith(`${name}.`)
      )?.[1];
    return {
      value,
      error,
      isTouched: Object.hasOwn(state.touched, name),
      isDirty: !isDeepEqual(value, getPath(state.defaultValues, name)),
      isValidating: validatorRuns.has(name),
      isRequired: isRequired(name),
    };
  };

  return {
    getState: () => state,
    getValues: () => state.values,
    getValue: ((name: string) =>
      getPath(state.values, name)) as FormApi<TValues>["getValue"],
    getFieldState: getFieldState as FormApi<TValues>["getFieldState"],
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setValue,
    blur,
    setError,
    setFormError,
    clearErrors,
    applyServerErrors,
    reset,
    validate,
    handleSubmit,
    focusFirstError,
    focusField: (name) => {
      const element = elementOf(name);
      const target = element === null ? null : focusTarget(element);
      if (target === null) return false;
      revealAndFocus(target);
      return true;
    },
    array: array as FormApi<TValues>["array"],
    getArrayKeys: keysFor,
    registerField: (name, registration) => {
      const entries = registrations.get(name) ?? new Set();
      entries.add(registration);
      registrations.set(name, entries);
      return () => {
        entries.delete(registration);
        if (entries.size === 0 && registrations.get(name) === entries) {
          registrations.delete(name);
        }
      };
    },
    getFieldElement: elementOf,
    getFieldLabel: (name) =>
      [...(registrations.get(name) ?? [])].find(
        (registration) => registration.label !== undefined
      )?.label,
    registerSummary: (getElement) => {
      summaries.add(getElement);
      return () => {
        summaries.delete(getElement);
      };
    },
    get messages() {
      return messages();
    },
  };
};

export default createFormStore;
