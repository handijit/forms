import typescript from "@rollup/plugin-typescript";
import { dts } from "rollup-plugin-dts";

// One file per entry, each bundled on its own. The ui and tr entries import the core by its
// package name (kept external), so an application loads one copy of it: one React context and
// one store, whichever entries it uses.
const ENTRIES = {
  // Hooks and a component: a client module for the React Server Components bundlers.
  index: { isClient: true },
  ui: { isClient: true },
  // Pure formatters: usable on the server as well.
  tr: { isClient: false },
};

// Peer dependencies and the package itself stay imports; nothing else is left to bundle.
const isExternal = (id) =>
  /^(react|react-dom|zod|@handijit\/(forms|ui|tr))(\/|$)/.test(id);

// TypeScript alone downlevels to the tsconfig target; no Babel anywhere.
const ts = () =>
  typescript({
    tsconfig: "./tsconfig.json",
    noEmitOnError: true,
  });

export default Object.entries(ENTRIES).flatMap(([entry, { isClient }]) => {
  // Rollup drops a module-level directive from the sources; the banner restores it at the top
  // of the built file, where Next.js looks for it.
  const banner = isClient ? '"use client";' : undefined;
  return [
    {
      input: `./lib/${entry}.ts`,
      external: isExternal,
      output: [
        { file: `./build/${entry}.mjs`, format: "es", sourcemap: true, banner },
        {
          file: `./build/${entry}.cjs`,
          format: "cjs",
          exports: "named",
          // ui's CommonJS files carry `__esModule` and `exports.default`: honour that marker
          // instead of treating the whole `require()` result as the default export.
          interop: "auto",
          sourcemap: true,
          banner,
        },
      ],
      plugins: [ts()],
    },
    {
      // One bundled declaration, written twice: TypeScript reads the format of a declaration
      // file from its extension, so the ESM entry needs a .d.mts next to the CommonJS .d.ts.
      input: `./lib/${entry}.ts`,
      external: isExternal,
      output: [
        { file: `./build/${entry}.d.ts`, format: "es" },
        { file: `./build/${entry}.d.mts`, format: "es" },
      ],
      plugins: [dts({ tsconfig: "./tsconfig.json" })],
    },
  ];
});
