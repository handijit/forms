import { existsSync, readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

const OUTPUTS = [
  "build/index.mjs",
  "build/index.cjs",
  "build/ui.mjs",
  "build/ui.cjs",
  "build/tr.mjs",
  "build/tr.cjs",
];

// What a renderer bundle pays, measured on the shipped (unminified, commented) ES modules; a
// consumer's minifier takes roughly half off. The core is the store, the hooks and <Form>;
// the binders and the formatters come on top only when imported.
const GZIP_BUDGETS = {
  "build/index.mjs": 13000,
  "build/ui.mjs": 6000,
  "build/tr.mjs": 2000,
};

const missing = OUTPUTS.filter((file) => !existsSync(file));
if (missing.length > 0) {
  console.error(
    `report-size: missing ${missing.join(", ")}; run "npm run build" first`
  );
  process.exit(1);
}

const formatBytes = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;

const rows = OUTPUTS.map((file) => {
  const content = readFileSync(file);
  return {
    file,
    raw: content.length,
    gzip: gzipSync(content, { level: 9 }).length,
    brotli: brotliCompressSync(content).length,
  };
});

console.log("| File | Raw | Gzip | Brotli |");
console.log("| --- | --- | --- | --- |");
for (const { file, raw, gzip, brotli } of rows) {
  console.log(
    `| \`${file}\` | ${formatBytes(raw)} | ${formatBytes(gzip)} | ${formatBytes(brotli)} |`
  );
}

let failed = false;
console.log("");
for (const [file, budget] of Object.entries(GZIP_BUDGETS)) {
  const { gzip } = rows.find((row) => row.file === file);
  const verdict = gzip <= budget ? "within" : "OVER";
  console.log(`${file}: ${gzip} B gzip, ${verdict} the ${budget} B budget`);
  if (gzip > budget) failed = true;
}

if (failed) process.exit(1);
