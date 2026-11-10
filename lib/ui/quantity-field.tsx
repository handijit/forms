import type { ComponentProps, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import QuantityStepper from "@handijit/ui/quantity-stepper";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type NumberPath<TValues> = FieldPathByValue<TValues, number | null | undefined>;

export type QuantityFieldProps<
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof QuantityStepper>,
    "value" | "onChange" | "label" | "className"
  >;

/** ui's `QuantityStepper` in a `Field`, bound to a number field. */
const QuantityField = <
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
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
  isDisabled,
  ...stepperProps
}: QuantityFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
    validate: validate as never,
  });
  const { field } = bound;
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <FieldGroup a11y={a11y} onLeave={field.onBlur}>
          <QuantityStepper
            {...stepperProps}
            label={label}
            value={
              typeof field.value === "number"
                ? field.value
                : (stepperProps.min ?? 1)
            }
            onChange={(value) => field.setValue(value)}
            isDisabled={isDisabled ?? (bound.isDisabled || bound.isReadOnly)}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default QuantityField;
