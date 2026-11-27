import { existsSync, readFileSync } from "node:fs";
import { brotliCompressSync, gzipSync } from "node:zlib";

// The ES module of each entry is what a bundler reads; each has a gzip budget. The files ship
// unminified with their comments (the consumer's bundler minifies), so the budgets are generous
// against the raw text and tight enough to catch an accidentally bundled peer.
const BUDGETS = {
  "build/index.mjs": 13_500,
  "build/ui.mjs": 6_500,
  "build/tr.mjs": 2_500,
};
const OUTPUTS = [
  ...Object.keys(BUDGETS),
  "build/index.cjs",
  "build/ui.cjs",
  "build/tr.cjs",
  "build/index.d.ts",
  "build/ui.d.ts",
  "build/tr.d.ts",
];

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

console.log("| File | Raw | Gzip | Brotli | Gzip budget |");
console.log("| --- | --- | --- | --- | --- |");
for (const { file, raw, gzip, brotli } of rows) {
  const budget = BUDGETS[file];
  console.log(
    `| \`${file}\` | ${formatBytes(raw)} | ${formatBytes(gzip)} | ${formatBytes(brotli)} | ${budget === undefined ? "" : formatBytes(budget)} |`
  );
}

const over = rows.filter(
  ({ file, gzip }) => BUDGETS[file] !== undefined && gzip > BUDGETS[file]
);
for (const { file, gzip } of over) {
  console.error(
    `report-size: ${file} is ${gzip} B gzip, over its ${BUDGETS[file]} B budget`
  );
}
if (over.length > 0) process.exit(1);
console.log("\nEvery entry is within its gzip budget.");
