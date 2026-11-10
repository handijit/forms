import { useEffect, useInsertionEffect, useRef } from "react";

import type {
  FieldRegistration,
  FieldValidator,
  FormApi,
} from "../types/form.type";
import type { FieldPath } from "../types/path.type";

/**
 * Tells the form that a field is on screen: where to focus it, its label for the error summary
 * and its validator. `useField` and the ui binders call it; call it yourself only for a
 * control `useField` does not render.
 */
const useRegisterField = <TValues>(
  form: FormApi<TValues>,
  name: FieldPath<TValues>,
  registration: FieldRegistration
): void => {
  const latest = useRef(registration);
  useInsertionEffect(() => {
    latest.current = registration;
  });
  const { label } = registration;
  const hasValidator = registration.validate !== undefined;
  useEffect(() => {
    const validate: FieldValidator | undefined = hasValidator
      ? (value, context) => latest.current.validate?.(value, context)
      : undefined;
    return form.registerField(name, {
      getElement: () => latest.current.getElement(),
      ...(label === undefined ? {} : { label }),
      ...(validate === undefined ? {} : { validate }),
    });
  }, [form, name, label, hasValidator]);
};

export default useRegisterField;
