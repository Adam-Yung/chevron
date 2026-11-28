# scripts/owner/install-deps.sh

Agents may not install packages (owner rule after a flagged-download incident). Anything the project needs is listed here, pinned,
with lifecycle scripts off, and the owner runs it. Dry run by default so reading it is safe; `--run` executes.

- `playwright-core@1.65.1` drives Chromium for the end-to-end suite (`scripts/e2e/run.mjs`). Only the library: the Chromium build it
  expects (chromium-1255) is already in `~/Library/Caches/ms-playwright`, so no browser download is needed.
- `framer-motion`, `minisearch`, `react-scroll-into-view-if-needed` are no longer imported since the November 2026 re-architecture
  (CSS transitions, an in-house history ranker, `scrollIntoView`). Uninstalling only edits `package.json` and the lockfile.
