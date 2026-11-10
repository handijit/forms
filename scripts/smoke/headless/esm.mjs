import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import {
  DEFAULT_MESSAGES,
  Form,
  numberFormat,
  useField,
  useForm,
} from "@handijit/forms";

const fail = (message) => {
  throw new Error(`ESM entry is broken: ${message}`);
};

// Rendered on the server, as Next.js does with a client component: no window is touched.
const Email = ({ form }) => {
  const field = useField(form, "email", { label: "E-posta" });
  return createElement("input", { ...field.inputProps, type: "email" });
};
const SignUp = () => {
  const form = useForm({
    schema: z.object({ email: z.email() }),
    defaultValues: { email: "ada@example.com" },
    onSubmit: () => undefined,
  });
  return createElement(Form, { form }, createElement(Email, { form }));
};
const html = renderToString(createElement(SignUp));
if (!/novalidate/i.test(html)) fail("Form does not render noValidate");
if (!html.includes('value="ada@example.com"')) fail("useField value");
if (!html.includes('aria-required="true"')) fail("required from the schema");

if (numberFormat({ decimals: 2 }).format(1234.5) !== "1.234,5") fail("numberFormat");
if (!Object.isFrozen(DEFAULT_MESSAGES)) fail("DEFAULT_MESSAGES");

// The client directive survives the build, on the first line.
const require = createRequire(import.meta.url);
const entry = require.resolve("@handijit/forms").replace(/\.cjs$/, ".mjs");
if (!readFileSync(entry, "utf8").startsWith('"use client";')) fail('"use client"');

// The optional peers are not installed here: their entries fail to load, the core does not.
for (const subpath of ["ui", "tr"]) {
  try {
    await import(`@handijit/forms/${subpath}`);
    fail(`@handijit/forms/${subpath} loaded without its peer`);
  } catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
  }
}

console.log("ESM entry OK (headless, server-rendered)");
