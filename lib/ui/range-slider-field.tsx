import type { ComponentProps, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import RangeSlider from "@handijit/ui/range-slider";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type RangePath<TValues> = FieldPathByValue<
  TValues,
  readonly [number, number] | readonly number[] | null | undefined
>;

export type RangeSliderFieldProps<
  TValues = FieldValues,
  P extends RangePath<TValues> = RangePath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof RangeSlider>,
    "value" | "onChange" | "label" | "className"
  >;

/** ui's `RangeSlider` in a `Field`, bound to a `[low, high]` field. */
const RangeSliderField = <
  TValues = FieldValues,
  P extends RangePath<TValues> = RangePath<TValues>,
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
  ...sliderProps
}: RangeSliderFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
    validate: validate as never,
  });
  const { field } = bound;
  const [low = sliderProps.min, high = sliderProps.max] = Array.isArray(
    field.value
  )
    ? (field.value as number[])
    : [];
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <FieldGroup a11y={a11y} onLeave={field.onBlur}>
          <RangeSlider
            {...sliderProps}
            label={label}
            value={[low, high]}
            onChange={(value) => field.setValue(value)}
            isDisabled={isDisabled ?? (bound.isDisabled || bound.isReadOnly)}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default RangeSliderField;
