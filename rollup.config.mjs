import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

// One build per entry and no chunks shared between them (section 21). The ui and tr entries
// import the core by the package's own name, so an app that uses all three loads one core and
// one store per form.
const ENTRIES = [
  // Hooks and <Form>: client modules for React Server Components bundlers.
  { name: "index", input: "./lib/index.ts", isClient: true },
  { name: "ui", input: "./lib/ui.ts", isClient: true },
  // Plain functions, safe to call on the server.
  { name: "tr", input: "./lib/tr.ts", isClient: false },
];

// Peers and the package's own entry names are never bundled.
const external = [
  /^react($|\/)/,
  /^react-dom($|\/)/,
  /^zod($|\/)/,
  /^@handijitcom\//,
];

// TypeScript alone downlevels to the tsconfig target; no Babel anywhere.
const ts = () =>
  typescript({ tsconfig: "./tsconfig.json", noEmitOnError: true });

export default ENTRIES.flatMap(({ name, input, isClient }) => {
  // Rollup drops module-level directives, so the boundary is written on each output file.
  const banner = isClient ? '"use client";' : undefined;
  return [
    {
      input,
      external,
      output: [
        { file: `./build/${name}.mjs`, format: "es", sourcemap: true, banner },
        {
          file: `./build/${name}.cjs`,
          format: "cjs",
          exports: "named",
          // ui's CommonJS files are transpiled ES modules (`__esModule`, `exports.default`):
          // "auto" reads their default export, the default interop would take the module object.
          interop: "auto",
          sourcemap: true,
          banner,
        },
      ],
      plugins: [ts()],
    },
    {
      // One bundled declaration per entry, written twice: TypeScript reads the format of a
      // declaration file from its extension, so the ESM entry needs a .d.mts next to the .d.ts.
      input,
      external,
      output: [
        { file: `./build/${name}.d.ts`, format: "es" },
        { file: `./build/${name}.d.mts`, format: "es" },
      ],
      plugins: [dts({ tsconfig: "./tsconfig.json" })],
    },
  ];
});
