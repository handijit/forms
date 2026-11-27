import { createContext } from "react";

import type { FieldValues, FormApi } from "../types/form.type";

/** What `<Form>` hands down: the form and the states that apply to every field in it. */
export type FormContextValue = {
  form: FormApi<FieldValues>;
  isDisabled: boolean;
  isReadOnly: boolean;
};

/** The context `<Form>` provides; field binders read it when no `form` prop is given. */
const FormContext = /*#__PURE__*/ createContext<FormContextValue | null>(null);

export default FormContext;
