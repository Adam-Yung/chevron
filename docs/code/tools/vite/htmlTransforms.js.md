# tools/vite/htmlTransforms.js

HTML rewrites applied at build time by `vite.config.js`: the static-profile ones through `chevron-static-html`, `inlineFontCss` and
`moveAppStylesheetsAfterShell` through `chevron-hosted-html`.

- **Why strip `type="module"` and `crossorigin`:** browsers CORS-gate module scripts, and a page opened from `file://` has an opaque
  origin, so a module script never loads there. The static bundle is emitted as an IIFE, so a classic script is correct.
- **Why keep `crossorigin` on the font preload:** fonts are always fetched in CORS mode; a preload without it does not match the
  real request and the font downloads twice.
- **Why move the bundle to the end of `<body>`:** `vite-plugin-singlefile` inlines the bundle where the tag stands, in `<head>`, and
  `defer` has no effect on an inline script. The bundle then ran before `config.js` and `icons.js` defined `window.CONFIG` and
  `window.ICONS`, and the static build crashed at boot (`reading 'engines'`). Ordering is the invariant: config, icons, then the app.
- **Why `apply: 'build'` on the plugin:** in dev the same rewrite turned Vite's module entry into a classic script and the dev page
  never booted.

Tests: `tools/vite/htmlTransforms.test.js`.
- **Why inline the font (`inlineFonts`):** a `file://` page may not fetch font files (CORS), so the release zip showed a fallback
  font. The static build carries every face `public/font.css` declares (Onest and Graduate) as data URLs; comments in `public/font.css` are stripped first so the
  commented-out CJK example is never read as a real font.
- **Why inline only the font CSS in the hosted build (`inlineFontCss`):** `font.css` is 2 KB of `@font-face`, but a stylesheet link
  blocks first paint until it arrives, one extra round-trip on GitHub Pages. Inlining it removes that wait; the woff2 stays a
  separate, preloaded, service-worker-cached file instead of a data URL that every HTML response would carry.
- **Why move the app stylesheet into `<body>` in the hosted build (`moveAppStylesheetsAfterShell`):** a stylesheet in `<head>` holds
  back every paint until it arrives, so the first-paint shell waited for the 19 KB app CSS. In `<body>`, after the shell and before
  `config.js`, it blocks only what follows it. The classic scripts after it wait for it, and the module only runs once parsing is done,
  so the app never mounts unstyled (an e2e spec holds the CSS back to prove it). It runs with `order: 'post'`, after Vite has
  injected the asset tags.

Reviewed: ad9e2bd9
