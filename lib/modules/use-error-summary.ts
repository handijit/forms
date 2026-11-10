import { useCallback, useEffect, useRef, type RefObject } from "react";

import useStoreSelector from "../core/use-store-selector";
import shallowEqual from "../helpers/shallow-equal.helper";
import type { FormApi, FormState } from "../types/form.type";

export type ErrorSummaryItem = {
  name: string;
  message: string;
  /** The label the field registered, when it is on screen. */
  label: string | undefined;
  /** The id of the field's element, for an `href="#…"` link; `undefined` when off screen. */
  elementId: string | undefined;
  /** Scrolls to the field and focuses it; `false` when it is not on screen. */
  focus: () => boolean;
};

export type UseErrorSummaryResult = {
  /** After a submit, while there is anything to list. */
  isVisible: boolean;
  formErrors: readonly string[];
  items: readonly ErrorSummaryItem[];
  /**
   * Put it on the summary's container (with `tabIndex={-1}`): the form focuses the summary when
   * an error has no field on screen to focus.
   */
  ref: RefObject<HTMLElement | null>;
};

const selectSummary = <TValues>(
  state: FormState<TValues>
): Pick<FormState<TValues>, "errors" | "formErrors" | "submitCount"> => ({
  errors: state.errors,
  formErrors: state.formErrors,
  submitCount: state.submitCount,
});

/** The data of an error summary: every visible error, with a way to reach its field. */
const useErrorSummary = <TValues>(
  form: FormApi<TValues>
): UseErrorSummaryResult => {
  const ref = useRef<HTMLElement | null>(null);
  const { errors, formErrors, submitCount } = useStoreSelector(
    form,
    selectSummary,
    shallowEqual
  );
  useEffect(() => form.registerSummary(() => ref.current), [form]);
  const focusField = useCallback(
    (name: string) => form.focusField(name as never),
    [form]
  );

  const items = Object.entries(errors).map(([name, message]) => {
    const elementId = form.getFieldElement(name)?.id;
    return {
      name,
      message,
      label: form.getFieldLabel(name),
      elementId: elementId === "" ? undefined : elementId,
      focus: () => focusField(name),
    };
  });
  return {
    isVisible: submitCount > 0 && (items.length > 0 || formErrors.length > 0),
    formErrors,
    items,
    ref,
  };
};

export default useErrorSummary;
