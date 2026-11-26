# Load speed (hosted build on GitHub Pages)

## 2026-11-26 · Measured baseline; fix the critical path and perceived first paint, keep the stack

**Measured** with `scripts/perf/load.mjs` against `https://adam-yung.github.io/chevron/` (commit `03db0f4`, three runs each, Chromium,
DevTools network presets):

| Network | Cold: first paint = input visible | Warm (service worker) |
|---|---|---|
| Unthrottled | ~100 ms | ~35 ms |
| Fast 4G (150 ms RTT, 1.6 Mbps) | ~1.1 s | ~35 ms |
| Slow 4G (400 ms RTT, 400 kbps) | ~3.9 s | ~35 ms |

- First contentful paint and "input visible" coincide: nothing contentful paints before React mounts. Before that the user sees only
  the saved theme colour.
- First visit: 17 requests and about 160 KB over the wire, gzip (GitHub Pages serves no brotli). `Cache-Control: max-age=600` on everything,
  and it cannot be changed. React and React DOM are 45 KB of that; the app is 37 KB.
- Repeat visits come from the service worker in ~35 ms on any network, so the remaining work is all on the first visit.
- The deploy workflow takes ~23 s end to end, so there is nothing to gain there.
- The live test also found that `config.js?v=` and `icons.js?v=` missed the precache, which broke offline boot. That is fixed; see
  `docs/code/tools/vite/serviceWorker.js.md`.

**Decision:**
1. Inline `public/font.css` into the hosted HTML (done), because it was a render-blocking request for 2 KB of `@font-face`.
2. Next, a static first-paint shell in `index.html` that React replaces on mount. It is the largest perceived win, because cold slow
   networks show a blank colour for seconds.
3. Then measure whether `config.js` and `icons.js` still delay the module start before changing them.

**Weighed:**
- Build-time prerendering of the React tree: about the same perceived gain as a static shell, but large effort and a hydration risk
  against the no-stuck-state invariants.
- Swapping React for Preact: saves about 30 KB gzip, but it is a stack change that the brief does not ask for.
- Runtime caching instead of precaching the lazy panels: this weakens offline use, which the brief promises.
- Changing `font-display`: deferred to the shell work, because it decides what a slow first visit looks like.
