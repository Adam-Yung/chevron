# Development

> Verified: 2026-11-26 00:24 · Sources: `package.json`, `vite.config.js`, `scripts/verify.sh`, `scripts/e2e/run.mjs`, `tools/vite/htmlTransforms.js`, `scripts/owner/install-deps.sh`

## Run
- `npm run dev`: dev server with hot reload.
- `npm run build`: the static single file, `dist/index.html`. It runs from `file://`, a local server or Termux.
- `npm run build:hosted`: code-split build with a service worker, for GitHub Pages or any HTTP server.

## Check
- `npm test`: unit tests (Vitest, jsdom), colocated as `*.test.js(x)` next to the code.
- `node scripts/e2e/run.mjs [filter]`: end-to-end specs in Chromium against `dist/` (build first). `E2E_DIST=<dir>` tests another
  build folder, `E2E_HEADED=1` shows the browser. Every outside request is stubbed; nothing leaves the machine.
- `scripts/verify.sh`: the full gate (tests, lint, structure limits on touched files, both builds, e2e, doc checks). Run it through
  `~/.claude-personal/framework/bin/gate` before committing.

The e2e runner needs `playwright-core`. Until `scripts/owner/install-deps.sh --run` adds it to the project, put the path of an
existing copy in the untracked file `scripts/e2e/playwright-path.local`, or set `PLAYWRIGHT_CORE`.

## Where things live
| Path | Holds |
|---|---|
| `src/state/` | The UI state: one reducer and its invariants |
| `src/input/` | The key router and the keyboard, pointer and touch listeners |
| `src/navigation/` | Opening destinations and releasing a navigation that did not leave |
| `src/search/` | Destination resolution, suggestions, history, remote suggestions |
| `src/answers/` | Instant answers (calculator, units, currency, time zones) |
| `src/features/` | One folder per visible feature |
| `src/settings/`, `src/storage/` | The settings schema and provider; localStorage persistence |
| `src/lib/` | Small shared helpers |
| `docs/code/` | One note per source file: why it exists, invariants, pitfalls |

The rules that keep the app from getting stuck are in `docs/decisions/architecture.md`.
