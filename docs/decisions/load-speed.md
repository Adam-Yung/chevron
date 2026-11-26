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

## 2026-11-26 · First-paint shell with early-key buffering; app CSS below the shell; cheatsheet on demand; `font-display: swap` kept

**Live re-measure after pushing `e9d9ac3`** (font.css inlined, offline precache fix), same script, three runs each: 16 requests
(was 17); cold first paint = input visible at ~85 ms unthrottled, ~1.1 s Fast 4G, ~3.85 s Slow 4G; warm ~35 ms; the offline reload
now boots with no failed request. Inlining font.css removed a request but did not move first paint: the app stylesheet in `<head>`
still held every paint until it arrived.

**Decision:**
1. A static first-paint shell in `index.html`, outside `#root` (`docs/code/src/app/bootShell.js.md`): the idle chevron as inline SVG with the
   canvas's geometry and the saved theme's colour, plus a hidden focused textarea that keeps keys typed before mount and hands them
   to the search field (`src/app/bootShell.js`). The shell chevron leaves when the canvas has drawn its first frame, or at once when
   the view leaves idle. Keys typed before mount are not echoed until the app takes over; accepted, since echoing them means a
   second, unstyled copy of the query field. Escape before mount clears them.
2. The hosted build moves the app stylesheet from `<head>` into `<body>`, below the shell and above `config.js`. Without this the
   shell itself waited for the CSS.
3. The cheatsheet mounts only while open, so boot no longer fetches its chunk; the service worker still precaches it after boot.
4. `font-display: swap` stays. The shell has no text, and the idle screen almost none, so a late font swaps little that is visible;
   `optional` would leave a slow first visit in the fallback font for the whole session.
5. `config.js` and `icons.js` stay external. Inlined in a scratch build they took 140 ms (Fast 4G) and 360 ms (Slow 4G) off "input
   visible" on the local server, about 5 %. That server speaks HTTP/1.1 without gzip, which overstates both request and byte costs
   next to Pages (HTTP/2, gzip). It would also add 12 KB gzip to every cold HTML response; not worth it on this evidence.

**Measured** with `scripts/perf/load.mjs` on local builds (no gzip, so absolute numbers are worse than Pages; compare rows only):

| Local hosted build, cold | First paint before → after | Input visible before → after |
|---|---|---|
| Fast 4G | 2.30 s → 0.29 s | 2.30 s → 2.30 s |
| Slow 4G | 8.70 s → 0.62 s | 8.70 s → 8.70 s |

CLS stays 0. Shell and app screenshots (default light, default dark, portrait, a custom theme with size 30 and thickness 6) differ
by at most 7 of 255 on any channel in the chevron area, which is anti-aliasing.

**Weighed:**
- Shell without key buffering: the same paint win, but keys typed during a slow load were still lost, against priority 2.
- Shell inside `#root`: React's first render replaces it, and the chevron then disappears until the worker has loaded and drawn,
  a visible flash on every cold visit.
- Build-time prerender: still judged too costly against the same gain (previous entry); nothing new reopens it.
- Loading the app CSS with the `media="print"` swap trick: it no longer blocks paint, but nothing then stops React mounting
  unstyled. The in-body link keeps that ordering for free.

## 2026-11-26 · Live result of the first-paint shell (`452820d`)

Measured on `https://adam-yung.github.io/chevron/` with `scripts/perf/load.mjs`, three runs each, against the `e9d9ac3` row above:

| Network, cold | First paint | Input visible |
|---|---|---|
| Unthrottled | ~85 ms → ~80 ms | ~85 ms → ~100 ms |
| Fast 4G | ~1.1 s → ~0.30 s | ~1.1 s → ~1.1 s |
| Slow 4G | ~3.85 s → ~0.60 s | ~3.85 s → ~3.86 s |

First-visit requests 16 → 14 (the Cheatsheet chunk and its CSS no longer load at boot). Warm visits ~35 ms; CLS 0; the offline reload
boots with no failed request. No further change is planned: what remains is the bundle's own download, which only a smaller stack
would shorten (weighed and declined in the first entry).
