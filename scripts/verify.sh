#!/usr/bin/env bash
# The commit gate: tests, lint, structure ratchet, builds, end-to-end, docs. Every step must pass; prints GATE-OK last. Run through
# ~/.claude-personal/framework/bin/gate so the commit hook can reuse the pass. Every step is offline.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
FW="${CLAUDE_FRAMEWORK:-$HOME/.claude-personal/framework}"
[[ -d $FW/gate ]] || { echo "framework not found at $FW (set CLAUDE_FRAMEWORK)" >&2; exit 1; }
BIN=./node_modules/.bin

# 1. Unit tests.
"$BIN/vitest" run --reporter=dot

# 2. Lint, warnings as errors. LINT_DIRS grows as the re-architecture rewrites each area (docs/todo.md); the end state is the whole repo.
LINT_DIRS=(src tools scripts test vite.config.js .eslintrc.cjs)
"$BIN/eslint" --max-warnings 0 --ext .js,.jsx,.mjs,.cjs "${LINT_DIRS[@]}"

# 3. Structure ratchet: strict nesting and complexity on touched files only.
files=$("$FW/gate/touched.sh" js jsx mjs)
if [[ -n $files ]]; then
  # shellcheck disable=SC2086
  "$BIN/eslint" --no-eslintrc -c .eslintrc.cjs --rule '{"max-depth": ["error", 3], "complexity": ["error", 12]}' $files
fi

# 4. Both build profiles. The static one is what the end-to-end suite loads.
"$BIN/vite" build --mode hosted --outDir dist-hosted --emptyOutDir --logLevel error
"$BIN/vite" build --logLevel error

# 5. End-to-end in Chromium (scripts/e2e/run.mjs explains how playwright-core is found).
node scripts/e2e/run.mjs

# 6. Docs: brief, mirrors, links, freshness, map.
python3 "$FW/gate/docgate.py" check .

# 7. De-slop ratchets: structure, duplication, dead code and doc hygiene may only improve (.deslop.json).
DESLOP="${DESLOP_HOME:-$HOME/.claude-personal/skills/de-slop}/scripts"
[[ -f $DESLOP/gates.py ]] || { echo "de-slop gates not found at $DESLOP" >&2; exit 1; }
PYTHONDONTWRITEBYTECODE=1 python3 "$DESLOP/gates.py" --root .

echo GATE-OK
