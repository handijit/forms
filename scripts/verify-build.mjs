// Checks the built entries against section 21: each imports only what its consumers provide,
// ES modules and CommonJS export the same names, client entries carry "use client", and every
// path package.json promises exists.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const ALLOWED_IMPORTS = {
  index: [/^react$/, /^react\/jsx-runtime$/, /^zod\/v4\/core$/],
  ui: [
    /^react$/,
    /^react\/jsx-runtime$/,
    /^@handijitcom\/forms$/,
    /^@handijitcom\/ui\/[a-z-]+$/,
  ],
  tr: [/^@handijitcom\/tr$/],
};
const CLIENT_ENTRIES = new Set(["index", "ui"]);

const failures = [];
const fail = (message) => failures.push(message);

const IMPORT_PATTERN = /^import\s[\s\S]*?from\s+["']([^"']+)["'];?$/gm;
const REQUIRE_PATTERN = /require\(["']([^"']+)["']\)/g;

for (const [entry, allowed] of Object.entries(ALLOWED_IMPORTS)) {
  const esm = readFileSync(`build/${entry}.mjs`, "utf8");
  const cjs = readFileSync(`build/${entry}.cjs`, "utf8");
  const specifiers = [
    ...[...esm.matchAll(IMPORT_PATTERN)].map((match) => match[1]),
    ...[...cjs.matchAll(REQUIRE_PATTERN)].map((match) => match[1]),
  ];
  for (const specifier of new Set(specifiers)) {
    if (!allowed.some((pattern) => pattern.test(specifier))) {
      fail(
        `build/${entry}: imports "${specifier}", which its consumers may not have`
      );
    }
  }
  const isClient = CLIENT_ENTRIES.has(entry);
  for (const [file, text] of [
    [`build/${entry}.mjs`, esm],
    [`build/${entry}.cjs`, cjs],
  ]) {
    if (text.startsWith('"use client";') !== isClient) {
      fail(
        `${file}: "use client" must be ${isClient ? "the first line" : "absent"}`
      );
    }
  }
}

// Same names from both formats. The entries import their peers, so they are loaded here with
// the dev installation's peers; the core's own name resolves to this package (self-reference).
const require = createRequire(import.meta.url);
for (const entry of Object.keys(ALLOWED_IMPORTS)) {
  const esmNames = Object.keys(
    await import(pathToFileURL(`build/${entry}.mjs`).href)
  ).sort();
  const cjsNames = Object.keys(require(`../build/${entry}.cjs`)).sort();
  if (JSON.stringify(esmNames) !== JSON.stringify(cjsNames)) {
    fail(
      `build/${entry}: ES module exports [${esmNames}] but CommonJS exports [${cjsNames}]`
    );
  }
}

// Every binder renders from both formats: a wrong CommonJS interop hands React a module object
// instead of a component, which only a render shows.
const OPTIONS = [{ value: "a", label: "A" }];
const BINDER_PROPS = {
  TextField: {},
  NumberField: {},
  TextareaField: {},
  PasswordField: {},
  DateField: {},
  SelectField: { options: OPTIONS },
  ComboboxField: { options: OPTIONS, labels: { placeholder: "Seçin" } },
  CheckboxField: {},
  SwitchField: {},
  RadioGroupField: { options: OPTIONS },
  RadioCardGroupField: { options: [{ value: "a", children: "A" }] },
  DateRangeField: { startLabel: "Başlangıç", endLabel: "Bitiş" },
  QuantityField: {},
  SegmentedField: { options: OPTIONS },
  ChipGroupField: { options: OPTIONS },
  RangeSliderField: { min: 0, max: 10 },
  RatingField: {},
  TagInputField: { removeLabel: "Kaldır" },
  FileUploadField: { removeLabel: "Kaldır", dropLabel: "Bırakın" },
  MoneyField: { minorDigits: 2 },
  PercentField: {},
  RateField: {},
  QuantityInputField: { unitDigits: 0 },
};
// ui's interface texts, so no component warns about a missing label.
const UI_LABELS = {
  required: "zorunlu",
  selectPlaceholder: "Seçin",
  passwordShow: "Göster",
  passwordHide: "Gizle",
  combobox: { clearLabel: "Temizle", searchPlaceholder: "Ara" },
  quantity: { label: "Adet", decrease: "Azalt", increase: "Artır" },
  range: { min: "En az", max: "En çok" },
  rating: { starCount: (star) => `${star} yıldız` },
  tagInput: {
    added: (value) => `${value} eklendi`,
    removed: (value) => `${value} kaldırıldı`,
    duplicate: (value) => `${value} zaten ekli`,
  },
  fileUpload: {
    tooLarge: (name, max) => `${name} ${max} sınırını aşıyor`,
    uploading: (name) => `${name} yükleniyor`,
    added: (count) => `${count} dosya eklendi`,
  },
};
const { createElement: h } = await import("react");
const { renderToString } = await import("react-dom/server");
const { z } = await import("zod");
const renderAll = (core, ui, UiProvider) => {
  const App = () => {
    const form = core.useForm({
      schema: z.object({ value: z.unknown() }),
      defaultValues: {},
      onSubmit: () => {},
    });
    return h(
      UiProvider,
      { labels: UI_LABELS },
      h(
        core.Form,
        { form },
        h(ui.ErrorSummary),
        ...Object.entries(BINDER_PROPS).map(([binder, props]) =>
          h(ui[binder], { key: binder, name: "value", label: binder, ...props })
        ),
        h(ui.SubmitButton)
      )
    );
  };
  return renderToString(h(App));
};
// Each format with ui's provider of the same format: ui's ES module and CommonJS copies keep
// separate contexts.
for (const [format, load, { UiProvider }] of [
  [
    "ES module",
    (entry) => import(pathToFileURL(`build/${entry}.mjs`).href),
    await import("@handijitcom/ui"),
  ],
  [
    "CommonJS",
    (entry) => require(`../build/${entry}.cjs`),
    require("@handijitcom/ui"),
  ],
]) {
  const ui = await load("ui");
  const unlisted = Object.keys(ui).filter(
    (name) => name.endsWith("Field") && !(name in BINDER_PROPS)
  );
  if (unlisted.length > 0) {
    fail(`verify-build: no render props for ${unlisted.join(", ")}`);
  }
  try {
    const html = renderAll(await load("index"), ui, UiProvider);
    if (!html.includes("Kaydet")) {
      fail(`${format}: the form rendered without its submit button`);
    }
  } catch (error) {
    fail(
      `${format}: rendering every binder failed: ${error.message.split("\n")[0]}`
    );
  }
}

const manifest = JSON.parse(readFileSync("package.json", "utf8"));
const promised = new Set([manifest.main, manifest.module, manifest.types]);
const collect = (target) => {
  if (typeof target === "string") promised.add(target);
  else if (target !== null && typeof target === "object") {
    Object.values(target).forEach(collect);
  }
};
collect(manifest.exports);
collect(manifest.typesVersions);
for (const path of promised) {
  if (!existsSync(path))
    fail(`package.json promises ${path}, which the build lacks`);
}

if (failures.length > 0) {
  for (const message of failures) console.error(`verify-build: ${message}`);
  process.exit(1);
}
console.log(
  `verify-build: ${Object.keys(ALLOWED_IMPORTS).length} entries, ${promised.size} promised paths OK`
);
