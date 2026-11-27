import type { ComponentType, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijitcom/forms";
import type { ScaledInputProps } from "@handijitcom/ui/scaled-input";

import FieldFrame from "./field-frame";
import summaryLabelOf from "./summary-label";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

/** The paths whose value is a number: what a scaled-integer field writes. */
export type NumberPath<TValues> = FieldPathByValue<
  TValues,
  number | null | undefined
>;

/** The props of a ui scaled-integer control the binder owns. */
export type ScaledOwnedProps =
  | "name"
  | "form"
  | "id"
  | "value"
  | "onChange"
  | "onBlur"
  | "required"
  | "aria-invalid"
  | "aria-describedby";

/** ui's `ScaledInput` and the fields built on it (money, percent, rate, quantity). */
export type ScaledControl = ComponentType<
  Omit<ScaledInputProps, "scaleDigits"> & { [prop: string]: unknown }
>;

type Props = FramedBinderProps<FieldValues, string> &
  Omit<ScaledInputProps, ScaledOwnedProps | "scaleDigits"> & {
    control: ScaledControl;
    [prop: string]: unknown;
  };

/**
 * A ui scaled-integer field (`MoneyInput`, `PercentInput`, `RateInput`, `QuantityInput`) in a
 * `Field`. The value is the scaled integer; an empty field, or a number still being typed, is
 * `null`.
 */
const ScaledField = ({
  control: Control,
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
}: Props): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label: summaryLabelOf(label, summaryLabel),
    validate: validate as never,
  });
  const { field } = bound;
  return (
    <FieldFrame
      bound={bound}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <Control
          {...inputProps}
          {...a11y}
          name={name}
          value={typeof field.value === "number" ? field.value : null}
          onChange={(value: number | null) => field.setValue(value)}
          onBlur={field.onBlur}
          disabled={disabled ?? bound.isDisabled}
          readOnly={readOnly ?? bound.isReadOnly}
        />
      )}
    </FieldFrame>
  );
};

export default ScaledField;
