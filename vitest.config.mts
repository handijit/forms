import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

// The peer range starts at React 18, so the browser tests also run on the copy installed in the
// private react18/ workspace.
const REACT_18 = fromRoot("./react18/node_modules");

const DOM_TESTS = ["__tests__/**/*.dom.test.ts", "__tests__/**/*.dom.test.tsx"];

export default defineConfig({
  resolve: {
    // The ui and tr entries import the core by the package name, as consumers do.
    alias: [
      {
        find: /^@handijitcom\/forms$/,
        replacement: fromRoot("./lib/index.ts"),
      },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["__tests__/**/*.test.ts"],
          exclude: DOM_TESTS,
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: DOM_TESTS,
          setupFiles: ["./vitest.setup.dom.ts"],
        },
      },
      {
        extends: true,
        resolve: {
          alias: [
            { find: /^react$/, replacement: `${REACT_18}/react` },
            { find: /^react\/(.*)$/, replacement: `${REACT_18}/react/$1` },
            { find: /^react-dom$/, replacement: `${REACT_18}/react-dom` },
            {
              find: /^react-dom\/(.*)$/,
              replacement: `${REACT_18}/react-dom/$1`,
            },
            // Their CommonJS builds would require React from the root through Node; the ES
            // module builds go through Vite and meet the aliases above.
            {
              find: /^@testing-library\/react$/,
              replacement: fromRoot(
                "./node_modules/@testing-library/react/dist/@testing-library/react.esm.js"
              ),
            },
            {
              find: /^react-bootstrap-icons$/,
              replacement: fromRoot(
                "./node_modules/react-bootstrap-icons/dist/index.js"
              ),
            },
          ],
        },
        test: {
          name: "react18",
          environment: "jsdom",
          include: DOM_TESTS,
          setupFiles: ["./vitest.setup.dom.ts"],
          // Processed by Vite, so that their own React imports meet the aliases above; Node would
          // hand them React 19 from the root node_modules.
          server: {
            deps: {
              inline: [
                /@testing-library\/react/,
                /@handijitcom\/ui/,
                /react-bootstrap-icons/,
              ],
            },
          },
        },
      },
    ],
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "lib/**/*.tsx"],
      // Type-only files have no behaviour; the logic-free entry barrels are measured by the
      // public surface tests.
      exclude: [
        "lib/index.ts",
        "lib/ui.ts",
        "lib/tr.ts",
        "lib/types/**",
        "lib/ui/ui.type.ts",
      ],
      thresholds: { 100: true },
    },
  },
});
