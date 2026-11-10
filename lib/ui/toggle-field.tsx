import type {
  ChangeEvent,
  ComponentProps,
  ReactElement,
  ReactNode,
} from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import type Checkbox from "@handijit/ui/checkbox";
import type Switch from "@handijit/ui/switch";

import FieldFrame from "./field-frame";
import type { BinderProps } from "./ui.type";
import useBoundField from "./use-bound-field";

/** The paths whose value is a boolean: what a checkbox or a switch writes. */
export type BooleanPath<TValues> = FieldPathByValue<
  TValues,
  boolean | null | undefined
>;

type ToggleControlProps = ComponentProps<typeof Checkbox> &
  ComponentProps<typeof Switch>;

export type ToggleFieldProps<
  TValues = FieldValues,
  P extends BooleanPath<TValues> = BooleanPath<TValues>,
  TControl extends typeof Checkbox | typeof Switch = typeof Checkbox,
> = BinderProps<TValues, P> &
  Omit<
    ComponentProps<TControl>,
    | "name"
    | "form"
    | "id"
    | "checked"
    | "defaultChecked"
    | "value"
    | "onChange"
    | "onBlur"
    | "label"
    | "required"
    | "aria-invalid"
    | "aria-describedby"
  > & {
    /** The visible label next to the control. */
    label: ReactNode;
    /** The label in the error summary, when `label` is not plain text. */
    summaryLabel?: string;
    /** Marks the control required; derived from the schema (`z.literal(true)`) when left out. */
    isRequired?: boolean;
    /** On ui's `Field` wrapper. */
    className?: string;
  };

type Props = ToggleFieldProps<FieldValues, string, typeof Checkbox> & {
  control: typeof Checkbox | typeof Switch;
};

/**
 * A checkbox or a switch: the control keeps its own label and hint; ui's `Field` (with an empty,
 * hidden label of its own) renders the error and links it.
 */
const ToggleField = ({
  control: Control,
  name,
  form,
  validate,
  label,
  summaryLabel,
  hint,
  isRequired,
  className,
  disabled,
  ...controlProps
}: Props): ReactElement => {
  const textLabel =
    summaryLabel ?? (typeof label === "string" ? label : undefined);
  const bound = useBoundField(form as never, name, {
    label: textLabel,
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
      isHintInControl
      {...(className === undefined ? {} : { className })}
    >
      {(a11y) => {
        const describedBy = [
          a11y["aria-describedby"],
          hint === undefined ? undefined : `${a11y.id}-hint`,
        ]
          .filter(Boolean)
          .join(" ");
        const props: ToggleControlProps = {
          ...controlProps,
          id: a11y.id,
          name,
          label,
          ...(hint === undefined ? {} : { hint }),
          checked: field.value === true,
          onChange: (event: ChangeEvent<HTMLInputElement>) =>
            field.setValue(event.target.checked),
          onBlur: field.onBlur,
          disabled: disabled ?? (bound.isDisabled || bound.isReadOnly),
          required: isRequired ?? field.isRequired,
          "aria-invalid": a11y["aria-invalid"],
          "aria-describedby": describedBy === "" ? undefined : describedBy,
        };
        return <Control {...props} />;
      }}
    </FieldFrame>
  );
};

export default ToggleField;
