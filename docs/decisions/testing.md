# Testing

## 2026-11-26 · Playwright Chromium end-to-end suite on playwright-core, with an in-house runner

**Decision:** stuck states and visual regressions are caught by `scripts/e2e/` specs running in real Chromium against the static
build, as part of the commit gate. The runner is ~80 lines on `playwright-core` instead of `@playwright/test`.

**Why:** the bugs that mattered (a frozen page after opening a new tab, Shift opening the menu mid-word, a canvas crash on `file://`)
only show in a real browser with real focus, history and popups; jsdom cannot reproduce them. One library is the smallest install
the owner has to approve (agents may not install), and the Chromium build it needs is already cached on the machine.

**Weighed:** `@playwright/test` (more features, a bigger install, its own config); jsdom only (fast but blind to these bugs).
Until `scripts/owner/install-deps.sh --run`, the runner reads a local path from the untracked `scripts/e2e/playwright-path.local`.
