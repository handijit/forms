import { z } from "zod";
import {
  numberFormat,
  useField,
  useFieldArray,
  useForm,
  useFormState,
  type FieldPath,
  type FormApi,
  type ServerErrors,
} from "@handijit/forms";

const schema = z.object({
  email: z.email(),
  joined: z.string().transform((value) => new Date(value)),
  items: z.array(z.object({ title: z.string(), price: z.number() })),
});
type Values = z.input<typeof schema>;

export const useSignUp = (): FormApi<Values> => {
  const form = useForm({
    schema,
    defaultValues: { email: "", items: [] },
    onSubmit: (values) => {
      const joined: Date = values.joined;
      return joined;
    },
  });
  const email: string = useField(form, "email").value;
  const rows = useFieldArray(form, "items");
  rows.append({ title: "", price: 0 });
  const isSubmitting: boolean = useFormState(form, (state) => state.isSubmitting);
  void [email, isSubmitting];
  const problem: ServerErrors = { status: 400, fields: ["items[0].title"] };
  form.applyServerErrors(problem);
  // @ts-expect-error a path that does not exist must not compile
  form.setValue("itemz", []);
  return form;
};

export const path: FieldPath<Values> = "items.0.price";
export const money = numberFormat({ decimals: 2 });

// @ts-expect-error a subpath the package does not export must not resolve
import("@handijit/forms/modules/use-form");
