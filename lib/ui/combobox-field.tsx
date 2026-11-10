import type { ComponentProps, ReactElement } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import Combobox from "@handijit/ui/combobox";

import FieldFrame from "./field-frame";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type ComboboxProps = ComponentProps<typeof Combobox<string>>;

export type ComboboxFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Pick<
    ComboboxProps,
    | "options"
    | "labels"
    | "onSearch"
    | "isLoading"
    | "isClearable"
    | "isSearchHidden"
    | "icon"
    | "isDisabled"
    | "testId"
  >;

/**
 * ui's `Combobox` in a `Field`, bound to a form field. Clearing writes `null`. `Combobox` has
 * no blur event: choosing marks the field touched.
 */
const ComboboxField = <
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
  ...comboboxProps
}: ComboboxFieldProps<TValues, P>): ReactElement => {
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
        <Combobox
          {...comboboxProps}
          {...a11y}
          value={typeof field.value === "string" ? field.value : null}
          onChange={(value) => {
            field.setValue(value);
            field.onBlur();
          }}
          isDisabled={isDisabled ?? (bound.isDisabled || bound.isReadOnly)}
        />
      )}
    </FieldFrame>
  );
};

export default ComboboxField;
