import { useCallback, useRef, useSyncExternalStore } from "react";

import type { FormApi, FormState } from "../types/form.type";

type Cache<TValues, S> = {
  state: FormState<TValues>;
  selector: (state: FormState<TValues>) => S;
  value: S;
};

/**
 * Subscribes to a slice of a form. The component renders again only when the slice changes by
 * `isEqual`, so typing in one field does not render the others.
 */
const useStoreSelector = <TValues, S>(
  form: FormApi<TValues>,
  selector: (state: FormState<TValues>) => S,
  isEqual: (a: S, b: S) => boolean
): S => {
  const cache = useRef<Cache<TValues, S> | null>(null);
  const getSnapshot = (): S => {
    const state = form.getState();
    const known = cache.current;
    if (
      known !== null &&
      known.state === state &&
      known.selector === selector
    ) {
      return known.value;
    }
    const next = selector(state);
    const value =
      known !== null && isEqual(known.value, next) ? known.value : next;
    cache.current = { state, selector, value };
    return value;
  };
  const subscribe = useCallback(
    (listener: () => void) => form.subscribe(listener),
    [form]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export default useStoreSelector;
