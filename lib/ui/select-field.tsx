import type { ComponentProps, ReactElement } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import Select from "@handijit/ui/select";

import FieldFrame from "./field-frame";
import type { NamedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type SelectProps = ComponentProps<typeof Select<string>>;

export type SelectFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = NamedBinderProps<TValues, P> &
  Pick<
    SelectProps,
    | "options"
    | "placeholder"
    | "closeLabel"
    | "icon"
    | "size"
    | "align"
    | "isDisabled"
    | "isReadOnly"
    | "testId"
  >;

/**
 * ui's `Select` in a `Field`, bound to a form field. An empty value (`undefined`, `null`, `""`)
 * shows the placeholder. Leaving the select (not moving into its list) is the field's blur.
 */
const SelectField = <
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
  ...selectProps
}: SelectFieldProps<TValues, P>): ReactElement => {
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
        <Select
          {...selectProps}
          {...a11y}
          label={label}
          value={typeof field.value === "string" ? field.value : null}
          onChange={(value) => field.setValue(value)}
          onBlur={field.onBlur}
          isDisabled={isDisabled ?? bound.isDisabled}
          isReadOnly={isReadOnly ?? bound.isReadOnly}
        />
      )}
    </FieldFrame>
  );
};

export default SelectField;
