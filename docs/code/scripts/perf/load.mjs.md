# scripts/perf/load.mjs

A manual measurement tool, not part of the gate: it needs a network for live URLs, and its timings vary from run to run.

- **Why cold and warm in the same browser context:** a fresh context has no HTTP cache and no service worker, like a first visit.
  The second load in that context, after a pause for precaching, is what every later new tab costs.
- **Why DevTools throttling presets:** unthrottled runs on a fast link hide the critical path. Slow 4G makes each extra round-trip
  and each extra kilobyte visible.
- **Why "input visible" beside FCP:** the brief's yardstick is when the app is ready, not when something paints. Since the
  first-paint shell, FCP comes well ahead of it, and keys typed in between are kept. "Input visible" waits for the app's own field
  (`textarea[role="combobox"]`), not the shell's hidden one.
- **Why the offline reload clears the HTTP cache:** GitHub Pages caches for 10 minutes. Without clearing it, the HTTP cache serves
  files that the service worker fails to, and an offline bug stays hidden. That is how the `config.js?v=` precache miss surfaced.
- **Comparing local builds:** pass a build folder. The local server does not gzip, so throttled numbers are worse than on Pages.
  Compare before and after on the same target, and never compare a local run with a live one.

Reuses `scripts/e2e/lib/playwright.mjs` (finding playwright-core without an install) and `scripts/e2e/lib/server.mjs`.
