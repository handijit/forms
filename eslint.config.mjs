import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

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

export default defineConfig([
  globalIgnores(["build/**", "coverage/**", "react18/node_modules/**"]),
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
    ],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-console": "error",
    },
  },
  {
    // The public contract must not be a side effect of type inference.
    files: ["lib/**/*.ts", "lib/**/*.tsx"],
    rules: { "@typescript-eslint/explicit-module-boundary-types": "error" },
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
  prettier,
]);
