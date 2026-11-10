import type { ComponentProps, ReactElement } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import Combobox from "@handijit/ui/combobox";

import FieldFrame from "./field-frame";
import summaryLabelOf from "./summary-label";
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
    | "isReadOnly"
    | "testId"
  >;

/**
 * ui's `Combobox` in a `Field`, bound to a form field. Clearing writes `null`. Leaving the
 * combobox (not moving into its search box or list) is the field's blur.
 */
const ComboboxField = <
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
>({
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
  isDisabled,
  isReadOnly,
  ...comboboxProps
}: ComboboxFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label: summaryLabelOf(label, summaryLabel),
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
          onChange={(value) => field.setValue(value)}
          onBlur={field.onBlur}
          isDisabled={isDisabled ?? bound.isDisabled}
          isReadOnly={isReadOnly ?? bound.isReadOnly}
        />
      )}
    </FieldFrame>
  );
};

export default ComboboxField;
