# Chevron: rules for this repo

Project-specific rules only. The general working rules (triage, docs with code, commit gate, structure ratchet) come from
`~/.claude-personal/CLAUDE.md`; do not copy them here.

## Start here
1. `docs/brief.md`: what this project is for and what wins a conflict.
2. `docs/status.md`: where things stand.
3. `docs/decisions/`: the topic files relevant to the task. Settled calls are not reopened without new evidence.

## Stack and commands
React 18 + Vite 5, plain JavaScript. `npm run dev` (dev server), `npm run build` (static single file, `dist/index.html`, works from
`file://`), `npm run build:hosted` (code-split + service worker), `npm test` (Vitest, jsdom), `node scripts/e2e/run.mjs` (Playwright
Chromium against `dist/`). The gate is `scripts/verify.sh` (run it through `~/.claude-personal/framework/bin/gate`).

## Invariants
- No state may block input. Navigation, animation and network all release the UI on every path (`docs/decisions/architecture.md`).
- What a key does is decided in one place, the key router; components never add their own global key listeners.
- Visuals follow state; an animation finishing never changes state.
- The static build runs from `file://`: no module scripts, no fetches of local files at boot, `config.js` and `icons.js` before the
  bundle.
- Nothing reaches the network at boot except what the user configured (weather, AI); suggestion and currency fetches are per query.
- Macro and engine URLs from user config are validated against `javascript:`, `data:`, `vbscript:`, `file:` before use.
