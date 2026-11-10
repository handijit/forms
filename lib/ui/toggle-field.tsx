import type {
  ChangeEvent,
  ComponentProps,
  ReactElement,
  ReactNode,
} from "react";
import type { FieldPathByValue, FieldValues } from "@handijit/forms";
import type Checkbox from "@handijit/ui/checkbox";
import type Switch from "@handijit/ui/switch";

import FieldTarget from "./field-target";
import summaryLabelOf from "./summary-label";
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
    | "error"
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
    /** On the control's root (its `<label>`). */
    className?: string;
  };

type Props = ToggleFieldProps<FieldValues, string, typeof Checkbox> & {
  control: typeof Checkbox | typeof Switch;
};

/**
 * A checkbox or a switch: the control draws its own label, hint and error (ui 2.2), linked with
 * `aria-describedby` and marked with `aria-invalid`.
 */
const ToggleField = ({
  control: Control,
  name,
  form,
  validate,
  label,
  summaryLabel,
  isRequired,
  disabled,
  ...controlProps
}: Props): ReactElement => {
  const bound = useBoundField(form as never, name, {
    label: summaryLabelOf(label, summaryLabel),
    validate: validate as never,
  });
  const { field } = bound;
  const props: ToggleControlProps = {
    ...controlProps,
    id: field.id,
    name,
    label,
    ...(field.error === undefined ? {} : { error: field.error }),
    checked: field.value === true,
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      field.setValue(event.target.checked),
    onBlur: field.onBlur,
    // ui has no read-only checkbox: a read-only form shows it disabled.
    disabled: disabled ?? (bound.isDisabled || bound.isReadOnly),
    required: isRequired ?? field.isRequired,
  };
  return (
    <FieldTarget form={bound.form} name={name} id={field.id}>
      <Control {...props} />
    </FieldTarget>
  );
};

export default ToggleField;
