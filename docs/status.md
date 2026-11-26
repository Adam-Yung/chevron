# Status

Present reality only, short: what works, what is in progress, open blockers. History is git and `docs/decisions/`; next work is
`docs/todo.md`. Replace a paragraph when it stops being true; do not append.

**Works (branch `overnight/rearchitecture`, not merged):** the re-architecture in `docs/decisions/architecture.md` is in: one UI
store, one key router, navigation that always releases, CSS-driven interruptible visuals. Enter navigates in under 10 ms (was 818 ms).
Static build runs from `file://` and over http; hosted build is code-split with a service worker. Instant answers cover math,
percentages, units, bases, currency and time zones. Pinned sites have an idle-screen dock. Every source file has a doc mirror; the
gate runs unit tests, lint with structure limits, both builds, the Chromium e2e suite and the doc checks.

**Blockers waiting on the owner:**
- approve `docs/brief.md` (drafted overnight);
- run `scripts/owner/install-deps.sh --run`: adds `playwright-core` (the e2e suite currently finds a copy through the untracked
  `scripts/e2e/playwright-path.local`) and removes three dependencies nothing imports any more.
