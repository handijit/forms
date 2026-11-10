import type { ComponentProps, ReactElement } from "react";
import {
  useFieldFormat,
  type AnyFieldFormat,
  type FieldFormat,
  type FieldPath,
  type FieldValues,
} from "@handijit/forms";
import Input from "@handijit/ui/input";

import FieldFrame from "./field-frame";
import PLAIN_TEXT from "./plain-text";
import summaryLabelOf from "./summary-label";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type InputProps = ComponentProps<typeof Input>;

export type TextFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<
    InputProps,
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
  > & {
    /** Value ↔ text conversion (money, phone, IBAN…); plain text when left out. */
    format?: AnyFieldFormat;
  };

/** ui's `Input` in a `Field`, bound to a form field. */
const TextField = <
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
  format,
  disabled,
  readOnly,
  ...inputProps
}: TextFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label: summaryLabelOf(label, summaryLabel),
    validate: validate as never,
  });
  const text = useFieldFormat(
    bound.field,
    (format ?? PLAIN_TEXT) as FieldFormat<unknown>
  );
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <Input
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

export default TextField;
