import {
  useMemo,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import type { FieldValues, FormApi } from "../types/form.type";
import FormContext, { type FormContextValue } from "./form-context";

export type FormProps<TValues> = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "onSubmit" | "noValidate" | "children"
> & {
  form: FormApi<TValues>;
  children?: ReactNode;
  /** Disables every bound field in the form. */
  isDisabled?: boolean;
  /** Makes every bound field read-only (controls without a read-only state are disabled). */
  isReadOnly?: boolean;
};

/**
 * A `<form noValidate>` that submits through the form (Enter in a field submits too, through
 * the native submit button) and hands the form down to the bound fields inside it.
 */
const Form = <TValues,>({
  form,
  children,
  isDisabled = false,
  isReadOnly = false,
  ...rest
}: FormProps<TValues>): ReactElement => {
  const value = useMemo<FormContextValue>(
    () => ({
      form: form as unknown as FormApi<FieldValues>,
      isDisabled,
      isReadOnly,
    }),
    [form, isDisabled, isReadOnly]
  );
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    void form.handleSubmit(event);
  };
  return (
    <FormContext.Provider value={value}>
      <form {...rest} noValidate onSubmit={onSubmit}>
        {children}
      </form>
    </FormContext.Provider>
  );
};

export default Form;
