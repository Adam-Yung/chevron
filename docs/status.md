# Status

Present reality only, short: what works, what is in progress, open blockers. History is git and `docs/decisions/`; next work is
`docs/todo.md`. Replace a paragraph when it stops being true; do not append.

**Works (branch `overnight/rearchitecture`, not merged):** the re-architecture in `docs/decisions/architecture.md` is in: one UI
store, one key router, navigation that always releases, CSS-driven interruptible visuals. Enter navigates in under 10 ms (was 818 ms).
Static build runs from `file://` and over http; hosted build is code-split with a service worker and boots offline with its bundled config and icons; load-time baseline in `docs/decisions/load-speed.md`. Instant answers cover math,
percentages, units, bases, currency and time zones. Pinned sites have an idle-screen dock. Every source file has a doc mirror; the
gate runs unit tests, lint with structure limits, both builds, the Chromium e2e suite and the doc checks. Toolchain is Vite 8,
Vitest 5 (Node 22.12+); `npm audit` reports 0 vulnerabilities.

**Blockers waiting on the owner:** approve `docs/brief.md` (drafted overnight).
