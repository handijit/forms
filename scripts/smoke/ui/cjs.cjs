const { createElement: h } = require("react");
const { renderToString } = require("react-dom/server");
const { z } = require("zod");
const { UiProvider } = require("@handijit/ui");
const { Form, useForm } = require("@handijit/forms");
const { TextField, fieldsOf } = require("@handijit/forms/ui");
const { moneyFormat } = require("@handijit/forms/tr");

const fail = (message) => {
  throw new Error(`CJS ui entry is broken: ${message}`);
};

const App = () => {
  const form = useForm({
    schema: z.object({ price: z.number() }),
    defaultValues: { price: 349000 },
    onSubmit: () => undefined,
  });
  const f = fieldsOf(form);
  if (f.TextField !== TextField) fail("fieldsOf");
  return h(
    UiProvider,
    { labels: { required: "(zorunlu)" } },
    h(Form, { form }, h(f.TextField, { name: "price", label: "Fiyat", format: moneyFormat }))
  );
};
// The ui entry finds the same core (one context): the field renders inside the Form.
if (!renderToString(h(App)).includes('value="3.490,00"')) fail("TextField in Form");

console.log("CJS ui and tr entries OK");
