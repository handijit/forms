#!/bin/sh
# Installs the packed tarball into an empty project, as a consumer would, and loads every entry
# by its published name as an ES module and as CommonJS, then renders a form on the server.
# Network access is needed for the peers.
set -e

ROOT="$(pwd)"

rm -f handijitcom-forms-*.tgz
npm pack --silent >/dev/null
TARBALL="$ROOT/$(ls handijitcom-forms-*.tgz)"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"; rm -f "$TARBALL"' EXIT
cd "$WORK"
npm init -y >/dev/null
npm install --ignore-scripts --no-audit --no-fund --loglevel=error \
  "$TARBALL" react@^19 react-dom@^19 zod@^4 @handijitcom/ui@^3 \
  @handijitcom/utils@^1 react-bootstrap-icons@^1.11 @handijitcom/tr@^1

cat > esm.mjs <<'JS'
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import { Form, numberFormat, useForm } from "@handijitcom/forms";
import { SubmitButton, TextField } from "@handijitcom/forms/ui";
import { moneyFormat, TR_MESSAGES } from "@handijitcom/forms/tr";

const schema = z.object({ name: z.string().min(1, TR_MESSAGES.tckn) });
const App = () => {
  const form = useForm({ schema, defaultValues: { name: "Ada" }, onSubmit: () => {} });
  return h(Form, { form }, h(TextField, { name: "name", label: "Ad" }), h(SubmitButton));
};
const html = renderToString(h(App));
if (!html.includes('value="Ada"') || !/novalidate/i.test(html)) {
  throw new Error(`ESM: unexpected server render: ${html}`);
}
if (numberFormat().format(1234) !== "1.234" || moneyFormat.format(349000) !== "3.490,00") {
  throw new Error("ESM: the formats are broken");
}
console.log("ESM entries OK");
JS

cat > cjs.cjs <<'JS'
const { createElement: h } = require("react");
const { renderToString } = require("react-dom/server");
const { z } = require("zod");
const { Form, useForm } = require("@handijitcom/forms");
const { TextField } = require("@handijitcom/forms/ui");
const { phoneFormat } = require("@handijitcom/forms/tr");

const schema = z.object({ name: z.string() });
const App = () => {
  const form = useForm({ schema, defaultValues: { name: "Ada" }, onSubmit: () => {} });
  return h(Form, { form }, h(TextField, { name: "name", label: "Ad" }));
};
if (!renderToString(h(App)).includes('value="Ada"')) {
  throw new Error("CJS: unexpected server render");
}
if (phoneFormat.parse("0532 123 45 67") !== "+905321234567") {
  throw new Error("CJS: the formats are broken");
}
console.log("CJS entries OK");
JS

node esm.mjs
node cjs.cjs
