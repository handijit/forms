import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const at = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

// The ui and tr entries import the core by its package name; the tests use the sources.
const SELF = { find: /^@handijit\/forms$/, replacement: at("./lib/index.ts") };

// React 18 lives in the private react18/ workspace. Every import of React, the library's,
// the tests' and those of the inlined dependencies below, is pointed at it, so a whole test
// run happens against React 18 alone.
const REACT_18 = at("./react18/node_modules/");
const react18 = [
  ["react", "react/index.js"],
  ["react/jsx-runtime", "react/jsx-runtime.js"],
  ["react/jsx-dev-runtime", "react/jsx-dev-runtime.js"],
  ["react-dom", "react-dom/index.js"],
  ["react-dom/client", "react-dom/client.js"],
  ["react-dom/server", "react-dom/server.node.js"],
  ["react-dom/test-utils", "react-dom/test-utils.js"],
].map(([name, file]) => ({
  find: new RegExp(`^${name}$`),
  replacement: `${REACT_18}${file}`,
}));
// Packages that import React are run through Vite so that the aliases reach them; the two with
// a CommonJS `main` are pointed at their ES module build, whose imports Vite can rewrite.
const ESM_BUILDS = [
  [
    "@testing-library/react",
    "@testing-library/react/dist/@testing-library/react.esm.js",
  ],
  ["react-bootstrap-icons", "react-bootstrap-icons/dist/index.js"],
].map(([name, file]) => ({
  find: new RegExp(`^${name}$`),
  replacement: at(`./node_modules/${file}`),
}));

const DOM_TESTS = ["__tests__/**/*.dom.test.{ts,tsx}"];

export default defineConfig({
  resolve: { alias: [SELF] },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["__tests__/**/*.test.{ts,tsx}"],
          exclude: DOM_TESTS,
        },
      },
      {
        extends: true,
        test: { name: "react-19", environment: "jsdom", include: DOM_TESTS },
      },
      {
        extends: true,
        resolve: { alias: [SELF, ...react18, ...ESM_BUILDS] },
        test: {
          name: "react-18",
          environment: "jsdom",
          include: DOM_TESTS,
          server: {
            deps: {
              inline: [
                /@handijit\/ui/,
                /@testing-library\/react/,
                /react-bootstrap-icons/,
              ],
            },
          },
        },
      },
    ],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}"],
      // Type-only files have no behaviour; the logic-free barrels are measured by index.test.ts.
      exclude: ["lib/index.ts", "lib/ui.ts", "lib/tr.ts", "lib/types/**"],
      thresholds: { 100: true },
    },
  },
});
