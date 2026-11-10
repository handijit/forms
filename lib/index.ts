// lib/index.ts holds no logic; the list below IS the public contract of `@handijit/forms`.
import DEFAULT_MESSAGES from "./constants/default-messages.constants";
import Form from "./modules/form";
import FormContext from "./modules/form-context";
import numberFormat from "./modules/number-format";
import useErrorSummary from "./modules/use-error-summary";
import useField from "./modules/use-field";
import useFieldArray from "./modules/use-field-array";
import useFieldFormat from "./modules/use-field-format";
import useForm from "./modules/use-form";
import useFormContext from "./modules/use-form-context";
import useFormState from "./modules/use-form-state";
import useRegisterField from "./modules/use-register-field";
import useUnsavedChanges from "./modules/use-unsaved-changes";
import useWatch from "./modules/use-watch";

export {
  DEFAULT_MESSAGES,
  Form,
  FormContext,
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
};
export type * from "./types";
export type { FormContextValue } from "./modules/form-context";
export type { FormProps } from "./modules/form";
export type { NumberFormatOptions } from "./modules/number-format";
export type {
  ErrorSummaryItem,
  UseErrorSummaryResult,
} from "./modules/use-error-summary";
export type {
  FieldControlProps,
  UseFieldOptions,
  UseFieldResult,
} from "./modules/use-field";
export type { UseFieldArrayResult } from "./modules/use-field-array";
export type {
  FieldFormatProps,
  FormattableField,
} from "./modules/use-field-format";
export type { UseUnsavedChangesOptions } from "./modules/use-unsaved-changes";
