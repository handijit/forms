import type { $ZodType, input, output } from "zod/v4/core";

import type {
  DeepPartial,
  FieldArrayItem,
  FieldArrayPath,
  FieldPath,
  FieldPathValue,
} from "./path.type";

/** The shape every form's values have: an object. */
export type FieldValues = Record<string, unknown>;

/** A Zod 4 schema (classic or mini) whose input is an object. */
export type FormSchema = $ZodType<unknown, FieldValues>;

/**
 * When errors become visible before the first submit. After a submit every mode checks on each
 * change.
 * - `submit` (default): silent until the first submit.
 * - `blur`: a field shows its errors once the user leaves it.
 * - `change`: a field shows its errors as soon as the user changes it.
 */
export type FormMode = "submit" | "blur" | "change";

/** The texts the form shows on its own. Zod error texts come from the schema. */
export type FormMessages = {
  /** Shown as a form-level error when `onSubmit` throws and no `onSubmitError` is given. */
  submitFailed: string;
  /** A server error that names a field without a message of its own. */
  serverFieldError: string;
};

/** Field errors keyed by path, one message per field. */
export type FieldErrors = Readonly<Record<string, string>>;

/** A snapshot of a form; a new object after every change. */
export type FormState<TValues> = {
  values: TValues;
  /** The baseline `isDirty` is measured against. */
  defaultValues: TValues;
  /** The visible field errors: server and manual errors first, then the schema's. */
  errors: FieldErrors;
  /** Errors that belong to no field: root refinements, server errors for unknown fields. */
  formErrors: readonly string[];
  /** Paths the user has left at least once. */
  touched: Readonly<Record<string, true>>;
  isDirty: boolean;
  /** `true` from the start of a submit until `onSubmit` settles. */
  isSubmitting: boolean;
  /** `true` while an async schema or field validator runs. */
  isValidating: boolean;
  /** The last submit passed validation and `onSubmit` resolved without server errors. */
  isSubmitSuccessful: boolean;
  submitCount: number;
};

/** Per-field state, as `useField` returns it. */
export type FieldState<TValue> = {
  value: TValue;
  /** The visible error of the field or of one of its descendants. */
  error: string | undefined;
  isTouched: boolean;
  isDirty: boolean;
  isValidating: boolean;
  /** Derived from the schema: the field rejects every empty value. */
  isRequired: boolean;
};

/** A field validator: an error message, or nothing when the value is fine. */
export type FieldValidator<TValue = unknown, TValues = FieldValues> = (
  value: TValue,
  context: { values: TValues; signal: AbortSignal }
) => string | null | undefined | Promise<string | null | undefined>;

/** What a rendered field tells its form. */
export type FieldRegistration = {
  /** The element to focus and scroll to when the field is invalid. */
  getElement: () => HTMLElement | null;
  /** The visible label, for the error summary. */
  label?: string;
  /** Runs on blur and on submit, after the schema accepted the field. */
  validate?: FieldValidator;
};

/** Server errors keyed by field path: `{ email: "Bu e-posta kayıtlı" }`. */
export type FieldErrorMap = Readonly<
  Record<string, string | readonly string[] | null | undefined>
>;

/**
 * An RFC 9457 problem document as the Han Dijit backend sends it: `fields` lists the rejected
 * request fields (`"items[0].name"` style paths are accepted) and `detail` carries the message.
 * A `fields` object with a message per field is accepted too.
 */
export type ProblemDetails = {
  status: number;
  type?: string;
  title?: string;
  detail?: string;
  code?: string;
  fields?: readonly string[] | FieldErrorMap;
};

/** What `applyServerErrors` accepts. A `status` number marks a problem document. */
export type ServerErrors = ProblemDetails | FieldErrorMap;

export type SetValueOptions = {
  /** Mark the field touched, as if the user had left it. */
  shouldTouch?: boolean;
  /** Check now and show the field's errors, whatever the mode. */
  shouldValidate?: boolean;
};

/** Passed to `onSubmit` and `onSubmitError`. */
export type SubmitHelpers<TValues> = Pick<
  FormApi<TValues>,
  "applyServerErrors" | "setError" | "setFormError" | "reset"
>;

export type UseFormOptions<TSchema extends FormSchema> = {
  schema: TSchema;
  defaultValues: DeepPartial<input<TSchema>>;
  /** Receives the parsed (output) values. A returned promise keeps the form submitting. */
  onSubmit: (
    values: output<TSchema>,
    helpers: SubmitHelpers<input<TSchema>>
  ) => unknown;
  /** Called after a submit that failed validation, with the visible errors. */
  onInvalid?: (errors: FieldErrors, formErrors: readonly string[]) => void;
  /** Called when `onSubmit` throws; without it the form shows `messages.submitFailed`. */
  onSubmitError?: (
    error: unknown,
    helpers: SubmitHelpers<input<TSchema>>
  ) => void;
  mode?: FormMode;
  messages?: Partial<FormMessages>;
};

/** One row of `useFieldArray`: a stable key for React and the row's path. */
export type FieldArrayRow<P extends string> = {
  key: string;
  index: number;
  name: `${P}.${number}`;
};

/** The array operations of a form, by path. */
export type FieldArrayApi<TValues, P extends FieldArrayPath<TValues>> = {
  append: (item: FieldArrayItem<TValues, P>) => void;
  prepend: (item: FieldArrayItem<TValues, P>) => void;
  insert: (index: number, item: FieldArrayItem<TValues, P>) => void;
  remove: (index: number | readonly number[]) => void;
  move: (from: number, to: number) => void;
  swap: (a: number, b: number) => void;
  replace: (items: readonly FieldArrayItem<TValues, P>[]) => void;
};

/** A form: a stable object; read it reactively through the hooks. */
export type FormApi<TValues> = {
  /** The current snapshot (not reactive; see `useFormState`). */
  getState: () => FormState<TValues>;
  getValues: () => TValues;
  getValue: <P extends FieldPath<TValues>>(
    name: P
  ) => FieldPathValue<TValues, P>;
  /** The state of one field, for the current snapshot. */
  getFieldState: <P extends FieldPath<TValues>>(
    name: P
  ) => FieldState<FieldPathValue<TValues, P>>;
  subscribe: (listener: () => void) => () => void;

  setValue: <P extends FieldPath<TValues>>(
    name: P,
    value: FieldPathValue<TValues, P>,
    options?: SetValueOptions
  ) => void;
  /** Marks a field touched: what leaving the field does. */
  blur: (name: FieldPath<TValues>) => void;
  /** A manual field error; it stays until the field changes or the next submit. */
  setError: (name: FieldPath<TValues>, message: string) => void;
  /** Adds a form-level error; it stays until the next submit. */
  setFormError: (message: string) => void;
  /** Clears the errors of one field, or every error. */
  clearErrors: (name?: FieldPath<TValues>) => void;
  /**
   * Shows server errors on their fields and focuses the first one. Errors for fields that are
   * not on screen become form-level errors.
   */
  applyServerErrors: (errors: ServerErrors) => void;
  /** Back to `values` (or the original defaults) as the new baseline; clears everything else. */
  reset: (values?: DeepPartial<TValues>) => void;
  /** Checks the whole form and shows every error. Resolves to whether it is valid. */
  validate: () => Promise<boolean>;
  /** The `<form onSubmit>` handler. Ignored while a submit is running. */
  handleSubmit: (event?: { preventDefault: () => void }) => Promise<void>;
  /** Moves focus to the first invalid field on screen (in document order). */
  focusFirstError: () => boolean;
  /** Focuses the element of one registered field. */
  focusField: (name: FieldPath<TValues>) => boolean;

  /** Array operations for the array at `name`. */
  array: <P extends FieldArrayPath<TValues>>(
    name: P
  ) => FieldArrayApi<TValues, P>;
  /** Stable React keys for the rows of the array at `name`. */
  getArrayKeys: (name: FieldArrayPath<TValues>) => readonly string[];

  /** Called by rendered fields; returns the unregister function. */
  registerField: (
    name: FieldPath<TValues>,
    registration: FieldRegistration
  ) => () => void;
  /** The label a rendered field registered, for the error summary. */
  getFieldLabel: (name: string) => string | undefined;
  /** The on-screen element of a registered field, or `null`. */
  getFieldElement: (name: string) => HTMLElement | null;
  /** The element focused when an error has no field on screen (the error summary). */
  registerSummary: (getElement: () => HTMLElement | null) => () => void;
  readonly messages: FormMessages;
};
