import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import { UiProvider } from "@handijit/ui";
import { isValidPhone } from "@handijit/tr";
import { Form, useForm } from "@handijit/forms";
import {
  CheckboxField,
  ErrorSummary,
  SelectField,
  SubmitButton,
  TextField,
} from "@handijit/forms/ui";
import { phoneFormat } from "@handijit/forms/tr";

const fail = (message) => {
  throw new Error(`ESM ui entry is broken: ${message}`);
};

const schema = z.object({
  email: z.email(),
  phone: z.string().refine(isValidPhone),
  city: z.enum(["ist", "ank"]),
  terms: z.literal(true),
});

const SignUp = () => {
  const form = useForm({
    schema,
    defaultValues: { email: "", phone: "+905321234567" },
    onSubmit: () => undefined,
  });
  return h(
    UiProvider,
    { labels: { required: "(zorunlu)", selectPlaceholder: "Seçin" } },
    h(
      Form,
      { form },
      h(ErrorSummary),
      h(TextField, { name: "email", label: "E-posta" }),
      h(TextField, { name: "phone", label: "Telefon", format: phoneFormat }),
      h(SelectField, {
        name: "city",
        label: "Şehir",
        options: [{ value: "ist", label: "İstanbul" }],
      }),
      h(CheckboxField, { name: "terms", label: "Koşullar" }),
      h(SubmitButton)
    )
  );
};

// Server-rendered: the binders and ui's components import without a window.
const html = renderToString(h(SignUp));
for (const expected of [
  "noValidate",
  "E-posta",
  "(zorunlu)",
  'value="0532 123 45 67"',
  'role="combobox"',
  'type="checkbox"',
  'type="submit"',
  "Kaydet",
]) {
  if (!html.includes(expected)) fail(`the markup has no ${expected}`);
}

console.log("ESM ui and tr entries OK (server-rendered with @handijit/ui)");
