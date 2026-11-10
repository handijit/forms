import type { ComponentProps, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import { DateRange } from "@handijit/ui/date-field";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { NamedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type DateRangeValue = { start: string; end: string };

type RangePath<TValues> = FieldPathByValue<
  TValues,
  Partial<DateRangeValue> | null | undefined
>;

export type DateRangeFieldProps<
  TValues = FieldValues,
  P extends RangePath<TValues> = RangePath<TValues>,
> = NamedBinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof DateRange>,
    | "value"
    | "onChange"
    | "className"
    | "id"
    | "required"
    | "aria-invalid"
    | "aria-describedby"
  >;

const EMPTY_RANGE: DateRangeValue = { start: "", end: "" };

/**
 * ui's `DateRange` in a `Field`, bound to a `{ start, end }` field. Errors on `start`, `end`
 * or the whole range show under it.
 */
const DateRangeField = <
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
  isReadOnly,
  ...rangeProps
}: DateRangeFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
    validate: validate as never,
  });
  const { field } = bound;
  const value = { ...EMPTY_RANGE, ...(field.value as Partial<DateRangeValue>) };
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <FieldGroup role="group" label={label} onLeave={field.onBlur}>
          <DateRange
            {...rangeProps}
            {...a11y}
            value={value}
            onChange={(next) => field.setValue(next)}
            isDisabled={isDisabled ?? bound.isDisabled}
            isReadOnly={isReadOnly ?? bound.isReadOnly}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default DateRangeField;
