import { useInsertionEffect, useState } from "react";
import type { input } from "zod/v4/core";

import createFormStore, { type StoreOptions } from "../core/create-form-store";
import type { FormApi, FormSchema, UseFormOptions } from "../types/form.type";

type Store<TSchema extends FormSchema> = {
  form: FormApi<input<TSchema>>;
  /** Hands the store the options of the latest render. */
  update: (options: UseFormOptions<TSchema>) => void;
};

/**
 * Creates a form for the life of the component. The returned object is stable; the component
 * that calls `useForm` does not render again while the user types. `defaultValues` is read
 * once (use `reset` to load new values); the schema, mode, messages and callbacks are read from
 * the latest render.
 */
const useForm = <TSchema extends FormSchema>(
  options: UseFormOptions<TSchema>
): FormApi<input<TSchema>> => {
  const [store] = useState((): Store<TSchema> => {
    let latest = options;
    return {
      form: createFormStore<input<TSchema>>(
        options.defaultValues as input<TSchema>,
        () => latest as unknown as StoreOptions
      ),
      update: (next) => {
        latest = next;
      },
    };
  });
  // Before any effect or event of this commit, so a handler never sees an older render's options.
  useInsertionEffect(() => {
    store.update(options);
  });
  return store.form;
};

export default useForm;
