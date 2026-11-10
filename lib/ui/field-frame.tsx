import type { ReactElement, ReactNode } from "react";
import Field, { type FieldChildProps } from "@handijit/ui/field";

import FieldTarget from "./field-target";
import type { BoundField } from "./use-bound-field";

/** The props every ui binder takes for its frame. */
export type FieldFrameProps = {
  label: string;
  hint?: string;
  /** Marks the field required; derived from the schema when left out. */
  isRequired?: boolean;
  /** The screen-reader text of the required mark; ui's `UiProvider` labels when left out. */
  requiredLabel?: string;
  isLabelHidden?: boolean;
  /** On ui's `Field` wrapper. */
  className?: string;
};

type Props = FieldFrameProps & {
  bound: BoundField;
  name: string;
  /** Where the control shows the hint itself (checkbox, switch). */
  isHintInControl?: boolean;
  children: (props: FieldChildProps) => ReactNode;
};

/** ui's `Field` around a bound control: label, hint, error and the accessibility links. */
const FieldFrame = ({
  bound,
  name,
  label,
  hint,
  isRequired,
  requiredLabel,
  isLabelHidden,
  className,
  isHintInControl = false,
  children,
}: Props): ReactElement => (
  <Field
    label={label}
    {...(hint === undefined || isHintInControl ? {} : { hint })}
    {...(bound.field.error === undefined ? {} : { error: bound.field.error })}
    isRequired={isRequired ?? bound.field.isRequired}
    {...(requiredLabel === undefined ? {} : { requiredLabel })}
    {...(isLabelHidden === undefined ? {} : { isLabelHidden })}
    {...(className === undefined ? {} : { className })}
  >
    {(props) => (
      <FieldTarget form={bound.form} name={name} id={props.id}>
        {children(props)}
      </FieldTarget>
    )}
  </Field>
);

export default FieldFrame;
