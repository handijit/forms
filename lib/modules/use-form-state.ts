import useStoreSelector from "../core/use-store-selector";
import shallowEqual from "../helpers/shallow-equal.helper";
import type { FormApi, FormState } from "../types/form.type";

const identity = <T>(value: T): T => value;

/**
 * Reads form state reactively. With a selector the component renders again only when the
 * selected slice changes (compared shallowly by default):
 * `useFormState(form, (state) => state.isSubmitting)`.
 */
const useFormState = <TValues, S = FormState<TValues>>(
  form: FormApi<TValues>,
  selector: (state: FormState<TValues>) => S = identity as (
    state: FormState<TValues>
  ) => S,
  isEqual: (a: S, b: S) => boolean = shallowEqual
): S => useStoreSelector(form, selector, isEqual);

export default useFormState;
