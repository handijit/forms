import type { ComponentProps, ReactElement } from "react";
import type { FieldPath, FieldValues } from "@handijit/forms";
import ChipGroup from "@handijit/ui/chip-group";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

export type ChipGroupFieldProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Pick<
    ComponentProps<typeof ChipGroup<string>>,
    "options" | "size" | "isScrollable"
  > & {
    /** Several chips at once: the value is a `string[]` instead of `string | null`. */
    isMultiple?: boolean;
  };

/** ui's `ChipGroup` in a `Field`, bound to a form field. */
const ChipGroupField = <
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
  isMultiple = false,
  ...groupProps
}: ChipGroupFieldProps<TValues, P>): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label,
    validate: validate as never,
  });
  const { field } = bound;
  const setValue = (value: string | string[] | null): void =>
    field.setValue(value);
  return (
    <FieldFrame
      bound={bound}
      name={name}
      label={label}
      {...{ hint, isRequired, requiredLabel, isLabelHidden, className }}
    >
      {(a11y) => (
        <FieldGroup a11y={a11y} onLeave={field.onBlur}>
          {isMultiple ? (
            <ChipGroup
              {...groupProps}
              label={label}
              isMultiple
              value={
                Array.isArray(field.value) ? (field.value as string[]) : []
              }
              onChange={setValue}
            />
          ) : (
            <ChipGroup
              {...groupProps}
              label={label}
              value={typeof field.value === "string" ? field.value : null}
              onChange={setValue}
            />
          )}
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default ChipGroupField;
