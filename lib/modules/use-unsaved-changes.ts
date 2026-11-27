import { useEffect } from "react";

import useStoreSelector from "../core/use-store-selector";
import type { FormApi, FormState } from "../types/form.type";

export type UseUnsavedChangesOptions = {
  /**
   * Asks the browser to confirm leaving the page while there are unsaved changes. In Electron
   * a blocked unload keeps the window open silently: handle `will-prevent-unload` in main, or
   * read the returned flag in your own close flow instead.
   */
  blockUnload?: boolean;
};

const selectUnsaved = <TValues>(state: FormState<TValues>): boolean =>
  state.isDirty && !state.isSubmitting;

/** `true` while the form holds changes that were not submitted. */
const useUnsavedChanges = <TValues>(
  form: FormApi<TValues>,
  { blockUnload = false }: UseUnsavedChangesOptions = {}
): boolean => {
  const hasUnsavedChanges = useStoreSelector(form, selectUnsaved, Object.is);
  useEffect(() => {
    if (!blockUnload || !hasUnsavedChanges) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      // Older Chromium (and so older Electron) still reads the legacy property.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [blockUnload, hasUnsavedChanges]);
  return hasUnsavedChanges;
};

export default useUnsavedChanges;
