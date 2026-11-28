#!/usr/bin/env bash
# Dependencies an agent may not install itself (see ~/.claude/CLAUDE.md). The owner runs this; dry run by default, --run executes.
# Every entry is named, version-pinned, and installed with lifecycle scripts off.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# playwright-core drives Chromium for scripts/e2e/run.mjs; the uninstalls drop packages nothing imports.
# Reasons per package: docs/code/scripts/owner/install-deps.sh.md.
CMDS=(
  "npm install --save-dev --save-exact --ignore-scripts playwright-core@1.65.1"
  "npm uninstall --ignore-scripts framer-motion minisearch react-scroll-into-view-if-needed"
)

if [[ "${1:-}" != "--run" ]]; then
  echo "Dry run. Would execute:"; printf '  %s\n' "${CMDS[@]}"; echo "Re-run with --run to execute."; exit 0
fi
for c in "${CMDS[@]}"; do echo "+ $c"; eval "$c"; done
