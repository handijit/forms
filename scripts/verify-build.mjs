import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { isDeepStrictEqual } from "node:util";

// Checks the built package against itself. The unit tests measure the sources; this measures
// what was written to build/: that each entry imports only its own peers (the core never
// reaches for the optional ui and tr packages), that the client entries start with
// "use client", that both formats export the same names, that every entry loads, and that
// every path promised by package.json exists.

const require = createRequire(import.meta.url);
const read = (file) => readFileSync(file, "utf8");

const problems = [];
const check = (condition, message) => {
  if (!condition) problems.push(message);
};

if (!existsSync("build/index.mjs")) {
  console.error('verify-build: build/ is missing; run "npm run build" first');
  process.exit(1);
}

// What each entry may import at run time, and what its declarations may refer to.
const isReact = (name) => /^react(\/jsx-runtime)?$/.test(name);
const isZod = (name) => name === "zod/v4/core";
const isUi = (name) => /^@handijit\/ui\/[a-z-]+$/.test(name);
const isCore = (name) => name === "@handijit/forms";
const ENTRIES = {
  // Headless: React and Zod only.
  index: {
    isClient: true,
    runtime: (name) => isReact(name) || isZod(name),
    types: (name) => name === "react" || isZod(name),
  },
  // The binders: React, the core by its name and ui components by their subpaths.
  ui: {
    isClient: true,
    runtime: (name) => isReact(name) || isCore(name) || isUi(name),
    types: (name) => name === "react" || isCore(name) || isUi(name),
  },
  // The formatters: @handijit/tr, and the core for its types only.
  tr: {
    isClient: false,
    runtime: (name) => name === "@handijit/tr",
    types: (name) => isCore(name),
  },
};

const importsOf = (source) => [
  ...new Set(
    [
      ...source.matchAll(
        /^\s*(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/gm
      ),
      ...source.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
      ...source.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g),
      ...source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
    ].map(([, name]) => name)
  ),
];
const esmExports = (source) =>
  [...source.matchAll(/^export\s*\{([^}]*)\}/gm)]
    .flatMap(([, list]) => list.split(","))
    .map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .pop()
    )
    .filter(Boolean)
    .sort();
const cjsExports = (source) =>
  [
    ...new Set(
      [...source.matchAll(/^exports\.(\w+)\s*=/gm)].map(([, name]) => name)
    ),
  ].sort();

let exportCount = 0;
for (const [entry, allowed] of Object.entries(ENTRIES)) {
  const esm = read(`build/${entry}.mjs`);
  const cjs = read(`build/${entry}.cjs`);

  // 1. The directive the React Server Components bundlers look for, on the first line.
  for (const [file, source] of [
    [`build/${entry}.mjs`, esm],
    [`build/${entry}.cjs`, cjs],
  ]) {
    check(
      source.startsWith('"use client";') === allowed.isClient,
      `${file}: ${allowed.isClient ? "must start" : "must not start"} with "use client"`
    );
  }

  // 2. Imports: a package outside the entry's peers would break a consumer without it.
  for (const [file, source] of [
    [`build/${entry}.mjs`, esm],
    [`build/${entry}.cjs`, cjs],
  ]) {
    for (const name of importsOf(source)) {
      check(
        allowed.runtime(name),
        `${file}: imports "${name}", which is not one of its peers`
      );
    }
  }
  for (const file of [`build/${entry}.d.ts`, `build/${entry}.d.mts`]) {
    for (const name of importsOf(read(file))) {
      check(allowed.types(name), `${file}: its types refer to "${name}"`);
    }
  }

  // 3. Both formats carry the same public names.
  const names = esmExports(esm);
  exportCount += names.length;
  check(names.length > 0, `build/${entry}.mjs: no exports found`);
  check(
    isDeepStrictEqual(names, cjsExports(cjs)),
    `build/${entry}.cjs: the export list differs from build/${entry}.mjs`
  );
  check(
    read(`build/${entry}.d.ts`) === read(`build/${entry}.d.mts`),
    `build/${entry}.d.mts: differs from build/${entry}.d.ts`
  );
}

// 4. Every entry loads in Node, in both formats, with the same exports (the ui entry finds
// the core through the package's own name).
for (const entry of Object.keys(ENTRIES)) {
  const esm = await import(`../build/${entry}.mjs`);
  const cjs = require(`../build/${entry}.cjs`);
  check(
    isDeepStrictEqual(Object.keys(esm).sort(), Object.keys(cjs).sort()),
    `build/${entry}: the loaded export lists differ between the formats`
  );
}

// 5. Every path promised by package.json exists.
const { exports: entryPoints, typesVersions } = JSON.parse(
  read("package.json")
);
const targets = (entry) =>
  typeof entry === "string" ? [entry] : Object.values(entry).flatMap(targets);
for (const target of [
  ...Object.values(entryPoints).flatMap(targets),
  ...Object.values(typesVersions["*"]).flat(),
]) {
  check(
    existsSync(target),
    `package.json points at ${target}, which does not exist`
  );
}

if (problems.length > 0) {
  console.error(`verify-build: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(
  `verify-build: ${Object.keys(ENTRIES).length} entries, ${exportCount} exports, both formats agree, the client entries say "use client" and every entry imports only its peers`
);
