// The core entry. The lists below ARE its public contract; this file holds no logic.
import DEFAULT_MESSAGES from "./constants/default-messages.constants";
import Form from "./modules/form";
import type { FormProps } from "./modules/form";
import FormContext from "./modules/form-context";
import type { FormContextValue } from "./modules/form-context";
import numberFormat from "./modules/number-format";
import type { NumberFormatOptions } from "./modules/number-format";
import useErrorSummary from "./modules/use-error-summary";
import type {
  ErrorSummaryItem,
  UseErrorSummaryResult,
} from "./modules/use-error-summary";
import useField from "./modules/use-field";
import type {
  FieldControlProps,
  UseFieldOptions,
  UseFieldResult,
} from "./modules/use-field";
import useFieldArray from "./modules/use-field-array";
import type { UseFieldArrayResult } from "./modules/use-field-array";
import useFieldFormat from "./modules/use-field-format";
import type {
  FieldFormatProps,
  FormattableField,
} from "./modules/use-field-format";
import useForm from "./modules/use-form";
import useFormContext from "./modules/use-form-context";
import useFormState from "./modules/use-form-state";
import useRegisterField from "./modules/use-register-field";
import useUnsavedChanges from "./modules/use-unsaved-changes";
import type { UseUnsavedChangesOptions } from "./modules/use-unsaved-changes";
import useWatch from "./modules/use-watch";
import type {
  FieldArrayApi,
  FieldArrayRow,
  FieldErrorMap,
  FieldErrors,
  FieldRegistration,
  FieldState,
  FieldValidator,
  FieldValues,
  FormApi,
  FormMessages,
  FormMode,
  FormSchema,
  FormState,
  ProblemDetails,
  ServerErrors,
  SetValueOptions,
  SubmitHelpers,
  UseFormOptions,
} from "./types/form.type";
import type { AnyFieldFormat, FieldFormat } from "./types/format.type";
import type {
  DeepPartial,
  FieldArrayItem,
  FieldArrayPath,
  FieldPath,
  FieldPathByValue,
  FieldPathValue,
  Leaf,
} from "./types/path.type";

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
export type {
  AnyFieldFormat,
  DeepPartial,
  ErrorSummaryItem,
  FieldArrayApi,
  FieldArrayItem,
  FieldArrayPath,
  FieldArrayRow,
  FieldControlProps,
  FieldErrorMap,
  FieldErrors,
  FieldFormat,
  FieldFormatProps,
  FieldPath,
  FieldPathByValue,
  FieldPathValue,
  FieldRegistration,
  FieldState,
  FieldValidator,
  FieldValues,
  FormApi,
  FormContextValue,
  FormMessages,
  FormMode,
  FormProps,
  FormSchema,
  FormState,
  FormattableField,
  Leaf,
  NumberFormatOptions,
  ProblemDetails,
  ServerErrors,
  SetValueOptions,
  SubmitHelpers,
  UseErrorSummaryResult,
  UseFieldArrayResult,
  UseFieldOptions,
  UseFieldResult,
  UseFormOptions,
  UseUnsavedChangesOptions,
};
