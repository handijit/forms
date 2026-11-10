import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// The layer rule of the package: the core runs without ui and tr; the ui and tr entries reach
// the core only through its package name, so the built files share one copy of it.
const OPTIONAL_PEERS = [
  {
    group: ["@handijit/ui", "@handijit/ui/*"],
    message: "Only lib/ui uses @handijit/ui.",
  },
  { group: ["@handijit/tr"], message: "Only lib/tr uses @handijit/tr." },
];
const CORE_BY_NAME = {
  group: ["../*"],
  message: 'Import the core as "@handijit/forms", never by a relative path.',
};

export default defineConfig([
  globalIgnores([
    "build/**",
    "coverage/**",
    "e2e/out/**",
    "test-results/**",
    "react18/**",
  ]),
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "no-console": "error",
    },
  },
  {
    // The public contract must not be a side effect of type inference.
    files: ["lib/**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/explicit-module-boundary-types": "error" },
  },
  {
    files: [
      "lib/index.ts",
      "lib/core/**",
      "lib/modules/**",
      "lib/helpers/**",
      "lib/constants/**",
      "lib/types/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...OPTIONAL_PEERS,
            {
              group: ["@handijit/forms"],
              message: "The core imports itself relatively.",
            },
            {
              group: ["**/ui/**", "**/tr/**", "**/ui", "**/tr"],
              message: "The core runs without the ui and tr entries.",
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
              name: "@handijit/ui",
              message:
                "Import ui components by their subpath (@handijit/ui/input).",
            },
          ],
          patterns: [CORE_BY_NAME, OPTIONAL_PEERS[1]],
        },
      ],
    },
  },
  {
    files: ["lib/tr/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [CORE_BY_NAME, OPTIONAL_PEERS[0]] },
      ],
    },
  },
  {
    // Build and release tooling: plain scripts that report on the console.
    files: ["**/*.mjs", "**/*.cjs", "**/*.js"],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
      },
    },
  },
  prettier,
]);
