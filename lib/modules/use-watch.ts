import { useCallback } from "react";

import useStoreSelector from "../core/use-store-selector";
import type { FormApi } from "../types/form.type";
import type { FieldPath, FieldPathValue } from "../types/path.type";

/**
 * The live value at `name`. Unchanged branches keep their identity, so watching `"address"`
 * does not render on a change to `"email"`.
 */
const useWatch = <TValues, P extends FieldPath<TValues>>(
  form: FormApi<TValues>,
  name: P
): FieldPathValue<TValues, P> => {
  const selector = useCallback(() => form.getValue(name), [form, name]);
  return useStoreSelector(form, selector, Object.is);
};

export default useWatch;
