import type { ComponentProps, ReactElement } from "react";
import {
  useFieldFormat,
  type FieldPath,
  type FieldValues,
} from "@handijit/forms";
import Textarea from "@handijit/ui/textarea";

import FieldFrame from "./field-frame";
import PLAIN_TEXT from "./plain-text";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

export type TextareaFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof Textarea>,
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

/** ui's `Textarea` in a `Field`, bound to a form field. */
const TextareaField = <
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
>({
  name,
  form,
  validate,
  label,
  hint,
  isRequired,
  requiredLabel,
  isLabelHidden,
  className,
  disabled,
  readOnly,
  ...textareaProps
}: TextareaFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
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
        <Textarea
          {...textareaProps}
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

export default TextareaField;
