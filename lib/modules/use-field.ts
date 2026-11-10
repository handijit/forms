import { useCallback, useId } from "react";

import useStoreSelector from "../core/use-store-selector";
import shallowEqual from "../helpers/shallow-equal.helper";
import type { FieldState, FieldValidator, FormApi } from "../types/form.type";
import type { FieldPath, FieldPathValue } from "../types/path.type";
import useRegisterField from "./use-register-field";

export type UseFieldOptions<TValue, TValues> = {
  /** Async or sync check that the schema cannot do (a server lookup); runs on blur and submit. */
  validate?: FieldValidator<TValue, TValues>;
  /** The visible label, for the error summary. */
  label?: string;
  /** The control's id; generated when left out. */
  id?: string;
  /** The field renders a hint at `hintId`; it joins `aria-describedby`. */
  hasHint?: boolean;
};

/** Accessibility attributes for the control of a field. */
export type FieldControlProps = {
  id: string;
  name: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  "aria-required": true | undefined;
  onBlur: () => void;
};

export type UseFieldResult<TValue> = FieldState<TValue> & {
  name: string;
  id: string;
  /** Where the error text must be rendered (`<p id={errorId}>`). */
  errorId: string;
  hintId: string;
  setValue: (value: TValue) => void;
  onBlur: () => void;
  controlProps: FieldControlProps;
  /** For a native text input: `controlProps` plus `value` and `onChange`. */
  inputProps: FieldControlProps & {
    value: string;
    onChange: (event: { target: { value: string } }) => void;
  };
};

/**
 * Binds one field: its live state (rendering only when this field changes), its setters and
 * the accessibility attributes of its control.
 */
const useField = <TValues, P extends FieldPath<TValues>>(
  form: FormApi<TValues>,
  name: P,
  options: UseFieldOptions<FieldPathValue<TValues, P>, TValues> = {}
): UseFieldResult<FieldPathValue<TValues, P>> => {
  const generatedId = useId();
  const id = options.id ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const selector = useCallback(() => form.getFieldState(name), [form, name]);
  const state = useStoreSelector(form, selector, shallowEqual);

  useRegisterField(form, name, {
    getElement: () => document.getElementById(id),
    ...(options.label === undefined ? {} : { label: options.label }),
    ...(options.validate === undefined
      ? {}
      : { validate: options.validate as FieldValidator }),
  });

  const setValue = useCallback(
    (value: FieldPathValue<TValues, P>) => form.setValue(name, value),
    [form, name]
  );
  const onBlur = useCallback(() => form.blur(name), [form, name]);

  const describedBy = [
    state.error === undefined ? undefined : errorId,
    options.hasHint === true ? hintId : undefined,
  ]
    .filter(Boolean)
    .join(" ");
  const controlProps: FieldControlProps = {
    id,
    name,
    "aria-invalid": state.error === undefined ? undefined : true,
    "aria-describedby": describedBy === "" ? undefined : describedBy,
    "aria-required": state.isRequired ? true : undefined,
    onBlur,
  };

  return {
    ...state,
    name,
    id,
    errorId,
    hintId,
    setValue,
    onBlur,
    controlProps,
    inputProps: {
      ...controlProps,
      value:
        state.value === undefined || state.value === null
          ? ""
          : String(state.value),
      onChange: (event) =>
        setValue(event.target.value as FieldPathValue<TValues, P>),
    },
  };
};

export default useField;
