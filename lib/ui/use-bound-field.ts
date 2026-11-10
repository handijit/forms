import { useContext } from "react";
import {
  FormContext,
  useField,
  type FieldValidator,
  type FormApi,
  type UseFieldResult,
} from "@handijit/forms";

export type BoundField = {
  form: FormApi<unknown>;
  field: UseFieldResult<unknown>;
  isDisabled: boolean;
  isReadOnly: boolean;
};

/** The form of a binder (its `form` prop, else the nearest `<Form>`) and its field. */
const useBoundField = (
  ownForm: FormApi<never> | undefined,
  name: string,
  options: {
    label: string | undefined;
    validate: FieldValidator<never, never> | undefined;
  }
): BoundField => {
  const context = useContext(FormContext);
  const form = (ownForm ?? context?.form) as FormApi<unknown> | undefined;
  if (form === undefined) {
    throw new Error(
      `@handijit/forms/ui: the field "${name}" has no form. Render it inside <Form form={form}> or pass the form prop.`
    );
  }
  const field = useField<unknown, string>(form, name, {
    label: options.label,
    validate: options.validate as FieldValidator<unknown, unknown> | undefined,
  });
  return {
    form,
    field,
    isDisabled: context?.isDisabled ?? false,
    isReadOnly: context?.isReadOnly ?? false,
  };
};

export default useBoundField;
