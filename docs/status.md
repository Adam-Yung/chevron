# Status

Present reality only, short: what works, what is in progress, open blockers. History is git and `docs/decisions/`; next work is
`docs/todo.md`. Replace a paragraph when it stops being true; do not append.

**Works (on `master`, deployed to GitHub Pages; owner review pending):** the re-architecture in `docs/decisions/architecture.md`
is in: one UI store, one key router, navigation that always releases, CSS-driven interruptible visuals. Enter navigates in under
10 ms (was 818 ms). Static build runs from `file://` and over http; hosted build is code-split with a service worker and boots
offline with its bundled config and icons. A first visit paints the chevron from a static shell before the bundle arrives (0.6 s
instead of 8.7 s on Slow 4G against a local build) and keeps keys typed before the app is ready; measurements in
`docs/decisions/load-speed.md`. Instant answers cover math, percentages, units, bases, currency and time zones. Pinned sites have an
idle-screen dock. Every source file has a doc mirror; the gate runs unit tests, lint with structure limits, both builds, the
Chromium e2e suite (static build, plus first-visit, offline and update specs on the hosted build) and the doc checks. Toolchain is
Vite 8, Vitest 5 (Node 22.12+); `npm audit` reports 0 vulnerabilities.

**Blockers waiting on the owner:** approve `docs/brief.md` (drafted overnight).

**Look:** Sleeve Patch is the default (`docs/decisions/visual-style.md`), live since 2026-11-26; owner review pending. The previous look is the git tag `stable`.
