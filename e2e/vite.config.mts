import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const at = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

/** The sample page of the browser test: the package's sources inside a real ui app. */
export default defineConfig({
  root: at("./app"),
  resolve: {
    alias: [
      { find: /^@handijit\/forms$/, replacement: at("../lib/index.ts") },
      { find: /^@handijit\/forms\/ui$/, replacement: at("../lib/ui.ts") },
      { find: /^@handijit\/forms\/tr$/, replacement: at("../lib/tr.ts") },
    ],
  },
  server: { port: 5281, strictPort: true },
  logLevel: "warn",
});
