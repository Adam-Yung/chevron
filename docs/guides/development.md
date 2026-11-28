# Development

> Verified: 2026-11-28 00:03 · Sources: `package.json`, `vite.config.js`, `scripts/verify.sh`, `scripts/e2e/run.mjs`, `tools/vite/htmlTransforms.js`, `scripts/owner/install-deps.sh`, `scripts/perf/load.mjs`

## Run
- `npm run dev`: dev server with hot reload.
- `npm run build`: the static single file, `dist/index.html`. It runs from `file://`, a local server or Termux.
- `npm run build:hosted`: code-split build with a service worker, for GitHub Pages or any HTTP server.

## Check
- `npm test`: unit tests (Vitest, jsdom), colocated as `*.test.js(x)` next to the code.
- `node scripts/e2e/run.mjs [filter]`: end-to-end specs in Chromium against `dist/` (build first). `E2E_DIST=<dir>` tests another
  build folder, `E2E_HOSTED_DIST=<dir>` the hosted one for the `hosted-*` specs (default `dist-hosted/`, which `scripts/verify.sh`
  builds), `E2E_HEADED=1` shows the browser. Every outside request is stubbed; nothing leaves the machine.
- `scripts/verify.sh`: the full gate (tests, lint, structure limits on touched files, both builds, e2e, doc checks, de-slop
  ratchets). Run it through `~/.claude-personal/framework/bin/gate` before committing. It needs `npm ci --prefix scripts/gate/lint`
  once; what the ratchets measure is in `.deslop.json`.

- `node scripts/perf/load.mjs <url | build dir> [--runs N] [--out report.json]`: cold and warm load timings at three network
  speeds, plus an offline reload, in Chromium. Not part of the gate. Baseline numbers are in `docs/decisions/load-speed.md`.

The e2e runner uses the project's `playwright-core`; the `PLAYWRIGHT_CORE` variable (or a path in an untracked
`playwright-path.local` next to the runner) points it at another copy.

## Dependencies
Toolchain: Vite 8 (Rolldown), Vitest 5 and `@vitejs/plugin-react` 6, which need Node 22.12 or newer. `npm audit` is clean. The
`overrides` in `package.json` pin patched transitive packages the direct dependencies have not picked up yet: `glob` under
`workbox-build` and `brace-expansion` 1.x under ESLint 8's `minimatch`. Drop an override once its parent ships the fix.

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
