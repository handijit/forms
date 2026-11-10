import { useInsertionEffect, useRef, useState } from "react";
import type { input } from "zod/v4/core";

import createFormStore, { type StoreOptions } from "../core/create-form-store";
import type { FormApi, FormSchema, UseFormOptions } from "../types/form.type";

/**
 * Creates a form for the life of the component. The returned object is stable; the component
 * that calls `useForm` does not render again while the user types. `defaultValues` is read
 * once (use `reset` to load new values); the schema, mode, messages and callbacks are read from
 * the latest render.
 */
const useForm = <TSchema extends FormSchema>(
  options: UseFormOptions<TSchema>
): FormApi<input<TSchema>> => {
  const latest = useRef(options);
  useInsertionEffect(() => {
    latest.current = options;
  });
  const [form] = useState(() =>
    createFormStore<input<TSchema>>(
      options.defaultValues as input<TSchema>,
      () => latest.current as unknown as StoreOptions
    )
  );
  return form;
};

export default useForm;
