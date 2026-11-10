import type { ReactElement, ReactNode } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import Radio from "@handijit/ui/radio";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { NamedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

export type RadioOption = {
  value: string;
  label: ReactNode;
  hint?: string;
  count?: number;
  isDisabled?: boolean;
};

export type RadioGroupFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = NamedBinderProps<TValues, P> & {
  options: readonly RadioOption[];
  isDisabled?: boolean;
  /** On the group element, for the layout of the radios. */
  groupClassName?: string;
};

/** ui's `Radio`s as one `radiogroup` in a `Field`, bound to a form field. */
const RadioGroupField = <
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
  options,
  isDisabled,
  groupClassName,
}: RadioGroupFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
    validate: validate as never,
  });
  const { field } = bound;
  const isGroupDisabled = isDisabled ?? (bound.isDisabled || bound.isReadOnly);
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <FieldGroup
          a11y={a11y}
          role="radiogroup"
          label={label}
          onLeave={field.onBlur}
          {...(groupClassName === undefined
            ? {}
            : { className: groupClassName })}
        >
          {options.map((option) => (
            <Radio
              key={option.value}
              name={name}
              value={option.value}
              label={option.label}
              {...(option.hint === undefined ? {} : { hint: option.hint })}
              {...(option.count === undefined ? {} : { count: option.count })}
              checked={field.value === option.value}
              onChange={() => field.setValue(option.value)}
              disabled={isGroupDisabled || option.isDisabled === true}
            />
          ))}
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default RadioGroupField;
