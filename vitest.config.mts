import { fileURLToPath } from "node:url";

import { library } from "@handijitcom/config/vitest";
import { mergeConfig } from "vitest/config";

const fromRoot = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

// The peer range starts at React 18, so the browser tests also run on the copy installed in the
// private react18/ workspace.
const REACT_18 = fromRoot("./react18/node_modules");

const DOM_TESTS = ["__tests__/**/*.dom.test.ts", "__tests__/**/*.dom.test.tsx"];

// Testing Library's cleanup and the jsdom gaps it needs filled; browser projects only.
const DOM_SETUP = "./vitest.setup.dom.ts";

// Node and jsdom projects, 100 % coverage. The logic-free entry barrels are measured by the public
// surface tests.
const preset = library({
  barrels: [
    "lib/index.ts",
    "lib/ui.ts",
    "lib/tr.ts",
    "lib/types/**",
    "lib/ui/ui.type.ts",
  ],
});

// The preset's jsdom project (React 19, from the root) also loads the DOM setup file.
const projects = preset.test?.projects?.map((project) =>
  typeof project === "object" &&
  "test" in project &&
  project.test?.name === "jsdom"
    ? mergeConfig(project, { test: { setupFiles: [DOM_SETUP] } })
    : project
);

export default mergeConfig(
  { ...preset, test: { ...preset.test, projects } },
  {
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
            setupFiles: [DOM_SETUP],
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
    },
  }
);
