import type { ComponentProps, ReactElement } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import SegmentedControl from "@handijit/ui/segmented-control";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { NamedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

export type SegmentedFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = NamedBinderProps<TValues, P> &
  Pick<
    ComponentProps<typeof SegmentedControl<string>>,
    "options" | "isIconOnly" | "size" | "isDisabled" | "isReadOnly" | "testId"
  >;

/** ui's `SegmentedControl` in a `Field`, bound to a form field. */
const SegmentedField = <
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
  isDisabled,
  isReadOnly,
  ...controlProps
}: SegmentedFieldProps<TValues, P>): ReactElement => {
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
        <FieldGroup onLeave={field.onBlur}>
          <SegmentedControl
            {...controlProps}
            {...a11y}
            label={label}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(value) => field.setValue(value)}
            isDisabled={isDisabled ?? bound.isDisabled}
            isReadOnly={isReadOnly ?? bound.isReadOnly}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default SegmentedField;
