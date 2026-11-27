import { useCallback, useMemo } from "react";

import useStoreSelector from "../core/use-store-selector";
import type {
  FieldArrayApi,
  FieldArrayRow,
  FormApi,
  FormState,
} from "../types/form.type";
import type { FieldArrayPath } from "../types/path.type";
import useRegisterField from "./use-register-field";

export type UseFieldArrayResult<
  TValues,
  P extends FieldArrayPath<TValues>,
> = FieldArrayApi<TValues, P> & {
  /** One row per item, with a key that follows the item through moves and removals. */
  rows: readonly FieldArrayRow<P>[];
  /** An error of the array itself ("add at least one row"). Render it: no field shows it. */
  error: string | undefined;
};

const noElement = (): null => null;

/** The rows of the array at `name` and the operations that change it. */
const useFieldArray = <TValues, P extends FieldArrayPath<TValues>>(
  form: FormApi<TValues>,
  name: P
): UseFieldArrayResult<TValues, P> => {
  const keysSelector = useCallback(() => form.getArrayKeys(name), [form, name]);
  const errorSelector = useCallback(
    (state: FormState<TValues>) => state.errors[name],
    [name]
  );
  const keys = useStoreSelector(form, keysSelector, Object.is);
  const error = useStoreSelector(form, errorSelector, Object.is);
  // Registered so that a server error for the array lands here, not at form level.
  useRegisterField(form, name, { getElement: noElement });

  const rows = useMemo(
    () =>
      keys.map((key, index) => ({
        key,
        index,
        name: `${name}.${index}` as `${P}.${number}`,
      })),
    [keys, name]
  );
  return { ...form.array(name), rows, error };
};

export default useFieldArray;
