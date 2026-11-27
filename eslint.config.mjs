import { library } from "@handijitcom/config/eslint";

// Section 21 layering: each entry imports its own folder and reaches another entry only by the
// package's published name, so the built entries share one copy of the core.
const CORE_FILES = [
  "lib/index.ts",
  "lib/constants/**",
  "lib/core/**",
  "lib/helpers/**",
  "lib/modules/**",
  "lib/types/**",
];

// The hooks live in plain .ts files as well as .tsx, and the tests render them.
const REACT_FILES = ["lib/**/*.{ts,tsx}", "__tests__/**/*.{ts,tsx}"];

export default [
  ...library({
    rootDir: import.meta.dirname,
    react: REACT_FILES,
    ignores: ["react18/node_modules/**"],
  }),
  {
    // Stricter than the preset's React Hooks set: a missing dependency is an error in the editor
    // too, and void useMemo callbacks are refused.
    files: REACT_FILES,
    rules: {
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/void-use-memo": "error",
    },
  },
  {
    files: CORE_FILES,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@handijitcom/*",
                "**/ui",
                "**/ui/**",
                "**/tr",
                "**/tr/**",
              ],
              message:
                "The core entry stands alone: it must not import the ui or tr entries or their peers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/ui/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@handijitcom/ui",
              message:
                "Import ui components by subpath (@handijitcom/ui/input) so unused ones are not bundled.",
            },
          ],
          patterns: [
            {
              group: ["../*", "@handijitcom/forms/*", "@handijitcom/tr"],
              message:
                "The ui entry reaches the core only through @handijitcom/forms, and never the tr entry.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/tr/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../*",
                "@handijitcom/forms/*",
                "@handijitcom/ui",
                "@handijitcom/ui/*",
                "react",
                "react/*",
              ],
              message:
                "The tr entry is plain functions: the core only through @handijitcom/forms, no React, no ui.",
            },
          ],
        },
      ],
    },
  },
  {
    // Test harnesses capture the form a component created and count renders from inside
    // components; the React Compiler rules guard library and app code, not that.
    files: ["__tests__/**"],
    rules: {
      "react-hooks/globals": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/static-components": "off",
    },
  },
];
