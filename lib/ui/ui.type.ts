import type {
  FieldPath,
  FieldPathValue,
  FieldValidator,
  FieldValues,
  FormApi,
} from "@handijit/forms";

import type { FieldFrameProps } from "./field-frame";

export type { FieldFrameProps };

/**
 * What every binder takes. `name` is checked against the form's values when the form's type is
 * known: from the `form` prop, from `fieldsOf(form)`, or from an explicit type argument.
 */
export type BinderProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = {
  name: P;
  /** The form; the nearest `<Form>` when left out. */
  form?: FormApi<TValues>;
  /** A check the schema cannot do (a server lookup); runs on blur and submit. */
  validate?: FieldValidator<FieldPathValue<TValues, P>, TValues>;
};

/** Binder props plus ui's `Field` frame. */
export type FramedBinderProps<
  TValues = FieldValues,
  P extends FieldPath<TValues> = FieldPath<TValues>,
> = BinderProps<TValues, P> & FieldFrameProps;
