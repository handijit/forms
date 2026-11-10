import type { ComponentProps, ReactElement } from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import TagInput from "@handijit/ui/tag-input";

import FieldFrame from "./field-frame";
import FieldGroup from "./field-group";
import type { FramedBinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

type TagsPath<TValues> = FieldPathByValue<
  TValues,
  readonly string[] | null | undefined
>;

export type TagInputFieldProps<
  TValues = FieldValues,
  P extends TagsPath<TValues> = TagsPath<TValues>,
> = FramedBinderProps<TValues, P> &
  Omit<
    ComponentProps<typeof TagInput>,
    | "values"
    | "onChange"
    | "label"
    | "id"
    | "required"
    | "aria-describedby"
    | "aria-invalid"
    | "className"
  >;

/** ui's `TagInput` in a `Field`, bound to a `string[]` field. */
const TagInputField = <
  TValues = FieldValues,
  P extends TagsPath<TValues> = TagsPath<TValues>,
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
  ...tagProps
}: TagInputFieldProps<TValues, P>): ReactElement => {
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
        <FieldGroup a11y={{ id: `${a11y.id}-group` }} onLeave={field.onBlur}>
          <TagInput
            {...tagProps}
            {...a11y}
            label={label}
            values={Array.isArray(field.value) ? (field.value as string[]) : []}
            onChange={(values) => field.setValue(values)}
            isDisabled={isDisabled ?? (bound.isDisabled || bound.isReadOnly)}
          />
        </FieldGroup>
      )}
    </FieldFrame>
  );
};

export default TagInputField;
