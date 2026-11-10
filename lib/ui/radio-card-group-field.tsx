import type { ReactElement, ReactNode } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import RadioCard from "@handijit/ui/radio-card";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

export type RadioCardOption = {
  value: string;
  /** The content of the card. */
  children: ReactNode;
  isDisabled?: boolean;
};

export type RadioCardGroupFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = FramedBinderProps<TValues, P> & {
  options: readonly RadioCardOption[];
  isDisabled?: boolean;
  /** On the group element, for the layout of the cards. */
  groupClassName?: string;
};

/** ui's `RadioCard`s as one `radiogroup` in a `Field`, bound to a form field. */
const RadioCardGroupField = <
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
}: RadioCardGroupFieldProps<TValues, P>): ReactElement => {
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
            <RadioCard
              key={option.value}
              name={name}
              value={option.value}
              isSelected={field.value === option.value}
              onChange={(value) => field.setValue(value)}
              isDisabled={isGroupDisabled || option.isDisabled === true}
            >
              {option.children}
            </RadioCard>
          ))}
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default RadioCardGroupField;
