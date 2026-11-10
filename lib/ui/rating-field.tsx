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
    "value" | "onChange" | "className"
  > & {
    /** On ui's `Field` wrapper. */
    className?: string;
  };

/**
 * ui's `RatingInput` bound to a number field. The rating draws its own legend; ui's `Field`
 * (with an empty, hidden label) adds the error below it.
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
      label=""
      isLabelHidden
      isRequired={false}
      {...(className === undefined ? {} : { className })}
    >
      {(a11y) => (
        <FieldGroup a11y={a11y} onLeave={field.onBlur}>
          <RatingInput
            {...ratingProps}
            label={label}
            value={typeof field.value === "number" ? field.value : null}
            onChange={(value) => field.setValue(value)}
            isDisabled={isDisabled ?? (bound.isDisabled || bound.isReadOnly)}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default RatingField;
