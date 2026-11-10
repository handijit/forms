import { useContext } from "react";

import type { FieldValues, FormApi } from "../types/form.type";
import FormContext from "./form-context";

/** The form of the nearest `<Form>`. Throws outside one. */
const useFormContext = <TValues = FieldValues>(): FormApi<TValues> => {
  const context = useContext(FormContext);
  if (context === null) {
    throw new Error(
      "@handijit/forms: useFormContext() must be called inside a <Form>."
    );
  }
  return context.form as unknown as FormApi<TValues>;
};

export default useFormContext;
