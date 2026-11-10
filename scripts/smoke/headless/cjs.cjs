const { createElement } = require("react");
const { renderToString } = require("react-dom/server");
const { z } = require("zod");
const forms = require("@handijit/forms");

const fail = (message) => {
  throw new Error(`CJS entry is broken: ${message}`);
};

const App = () => {
  const form = forms.useForm({
    schema: z.object({ name: z.string().min(2) }),
    defaultValues: { name: "" },
    onSubmit: () => undefined,
  });
  return createElement(forms.Form, { form, "aria-label": "Kayıt" });
};
if (!renderToString(createElement(App)).includes('aria-label="Kayıt"')) fail("Form");
if (typeof forms.useFieldArray !== "function") fail("useFieldArray");
require("@handijit/forms/package.json");

console.log("CJS entry OK (headless)");
