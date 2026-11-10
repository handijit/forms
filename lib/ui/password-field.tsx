import type { ComponentProps, ReactElement } from "react";
import {
  useFieldFormat,
  type FieldPath,
  type FieldValues,
} from "@handijit/forms";
import PasswordInput from "@handijit/ui/password-input";

import FieldFrame from "./field-frame";
import PLAIN_TEXT from "./plain-text";
import summaryLabelOf from "./summary-label";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

export type PasswordFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof PasswordInput>,
    | "name"
    | "form"
    | "id"
    | "value"
    | "defaultValue"
    | "onChange"
    | "onBlur"
    | "required"
    | "aria-invalid"
    | "aria-describedby"
  >;

/** ui's `PasswordInput` in a `Field`, bound to a form field. */
const PasswordField = <
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  form,
  validate,
  label,
  summaryLabel,
  hint,
  isRequired,
  requiredLabel,
  isLabelHidden,
  className,
  disabled,
  readOnly,
  ...inputProps
}: PasswordFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label: summaryLabelOf(label, summaryLabel),
    validate: validate as never,
  });
  const text = useFieldFormat(bound.field, PLAIN_TEXT);
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <PasswordInput
          {...inputProps}
          {...a11y}
          name={name}
          value={text.value}
          onChange={text.onChange}
          onBlur={text.onBlur}
          disabled={disabled ?? bound.isDisabled}
          readOnly={readOnly ?? bound.isReadOnly}
        />
      )}
    </FieldFrame>
  );
};

export default PasswordField;
