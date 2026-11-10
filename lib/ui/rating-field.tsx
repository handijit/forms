import type { ComponentProps, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import RatingInput from "@handijit/ui/rating-input";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { BinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type NumberPath<TValues> = FieldPathByValue<TValues, number | null | undefined>;

export type RatingFieldProps<
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
> = BinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof RatingInput>,
    | "value"
    | "onChange"
    | "className"
    | "id"
    | "required"
    | "aria-invalid"
    | "aria-describedby"
  > & {
    /** On ui's `Field` wrapper. */
    className?: string;
  };

/**
 * ui's `RatingInput` bound to a number field. The rating draws its own legend and takes the
 * field's links (ui 2.2); ui's `Field` (its label hidden: the legend is the visible one) adds the
 * error below it.
 */
const RatingField = <
  TValues = FieldValues,
  P extends NumberPath<TValues> = NumberPath<TValues>,
>({
  name,
  form,
  validate,
  label,
  className,
  isDisabled,
  isReadOnly,
  ...ratingProps
}: RatingFieldProps<TValues, P>): ReactElement => {
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
      isLabelHidden
      {...(className === undefined ? {} : { className })}
    >
      {(a11y) => (
        <FieldGroup onLeave={field.onBlur}>
          <RatingInput
            {...ratingProps}
            {...a11y}
            label={label}
            value={typeof field.value === "number" ? field.value : null}
            onChange={(value) => field.setValue(value)}
            isDisabled={isDisabled ?? bound.isDisabled}
            isReadOnly={isReadOnly ?? bound.isReadOnly}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default RatingField;
