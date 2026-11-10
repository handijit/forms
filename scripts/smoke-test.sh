#!/bin/sh
# Installs the packed tarball into empty projects and uses it the way consumers do: one with
# React and Zod only (the headless core), one with @handijit/ui and @handijit/tr as well.
# The tests measure the source; this measures the tarball a consumer installs.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/node_modules/.bin"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

cd "$ROOT"
TARBALL="$WORK/$(npm pack --silent --pack-destination "$WORK" | tail -n 1)"

# The tarball holds the three entries in both formats with their types, and nothing else.
tar -tzf "$TARBALL" | sort > "$WORK/files.txt"
node "$ROOT/scripts/smoke/tarball.mjs" "$WORK/files.txt"

# The React and type versions the consumers build against.
REACT="react@^19 react-dom@^19 @types/react@^19 zod@^4"

run_consumer() {
  NAME="$1"
  shift
  mkdir "$WORK/$NAME"
  cp "$ROOT/scripts/smoke/$NAME"/* "$WORK/$NAME/"
  cd "$WORK/$NAME"
  npm init -y >/dev/null
  # npm adds the required peers (react, zod); the optional ones only when listed here.
  npm install --ignore-scripts --no-audit --no-fund "$TARBALL" $REACT "$@" >/dev/null
  node esm.mjs
  node cjs.cjs
  # One consumer, three resolutions: a bundler, Node's CommonJS (the .d.ts files) and Node's
  # ES modules (the .d.mts files).
  cp consumer.ts consumer.mts
  "$BIN/tsc" -p tsconfig.bundler.json
  "$BIN/tsc" -p tsconfig.node.json
  echo "TypeScript consumer OK ($NAME)"
}

run_consumer headless
run_consumer ui "@handijit/ui@^2.2" "@handijit/utils@^2" "@handijit/design@^1.1" \
  "react-bootstrap-icons@^1.11" "@handijit/tr@^1"
