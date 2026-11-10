import { createElement, type ReactElement } from "react";
import { z } from "zod";
import { Form, useForm } from "@handijit/forms";
import { moneyFormat, phoneFormat } from "@handijit/forms/tr";
import {
  CheckboxField,
  ErrorSummary,
  fieldsOf,
  SubmitButton,
  TextField,
  type TextFieldProps,
} from "@handijit/forms/ui";

const schema = z.object({
  email: z.email(),
  phone: z.string(),
  price: z.number(),
  terms: z.literal(true),
});
type Values = z.input<typeof schema>;

export const SignUp = (): ReactElement => {
  const form = useForm({ schema, defaultValues: {}, onSubmit: () => undefined });
  const f = fieldsOf(form);
  // createElement cannot infer a generic component's type argument; JSX can.
  return createElement(
    Form<Values>,
    { form },
    createElement(ErrorSummary, {}),
    createElement(f.TextField, { name: "email", label: "E-posta" }),
    createElement(TextField<Values>, { form, name: "phone", label: "Telefon", format: phoneFormat }),
    createElement(TextField<Values>, { form, name: "price", label: "Fiyat", format: moneyFormat }),
    createElement(CheckboxField<Values>, { form, name: "terms", label: "Koşullar" }),
    createElement(SubmitButton, {})
  );
};

// ui's props resolve under every resolution (ui 2.2): an unknown prop must not compile.
// @ts-expect-error `isLoadingg` is not a prop of SubmitButton (ui's Button)
export const typo = createElement(SubmitButton, { isLoadingg: true });

// @ts-expect-error a name that is not a path of the form must not compile
export const wrong: TextFieldProps<Values>["name"] = "e-mail";
