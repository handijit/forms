import type { ReactElement, ReactNode } from "react";
import Field, { type FieldChildProps } from "@handijitcom/ui/field";

import type { BoundField } from "./use-bound-field";

/** The props every ui binder takes for its frame. */
export type FieldFrameProps = {
  /** The visible label: text, or an element (a link, an abbreviation) inside the `<label>`. */
  label: ReactNode;
  /** The label in the error summary, when `label` is not plain text. */
  summaryLabel?: string;
  /** The rule under the field ("En az 8 karakter"); linked with `aria-describedby`. */
  hint?: string;
  /** Marks the field required; derived from the schema when left out. */
  isRequired?: boolean;
  /** The screen-reader text of the required mark; ui's `UiProvider` labels when left out. */
  requiredLabel?: string;
  /** Hides the label visually; screen readers still read it. */
  isLabelHidden?: boolean;
  /** On ui's `Field` wrapper. */
  className?: string;
};

/**
 * The frame of a binder whose control also takes the label as its accessible name (a select's
 * trigger, a radio group): the label must be text there.
 */
export type NamedFieldFrameProps = Omit<
  FieldFrameProps,
  "label" | "summaryLabel"
> & {
  label: string;
};

type Props = Omit<FieldFrameProps, "summaryLabel"> & {
  bound: BoundField;
  children: (props: FieldChildProps) => ReactNode;
};

/**
 * ui's `Field` around a bound control: label, hint, error and the accessibility links. The
 * control takes the field's id, which `useField` registered, so the error summary's links and
 * the form's focus reach it.
 */
const FieldFrame = ({
  bound,
  label,
  hint,
  isRequired,
  requiredLabel,
  isLabelHidden,
  className,
  children,
}: Props): ReactElement => (
  <Field
    id={bound.field.id}
    label={label}
    {...(hint === undefined ? {} : { hint })}
    {...(bound.field.error === undefined ? {} : { error: bound.field.error })}
    isRequired={isRequired ?? bound.field.isRequired}
    {...(requiredLabel === undefined ? {} : { requiredLabel })}
    {...(isLabelHidden === undefined ? {} : { isLabelHidden })}
    {...(className === undefined ? {} : { className })}
  >
    {children}
  </Field>
);

export default FieldFrame;
