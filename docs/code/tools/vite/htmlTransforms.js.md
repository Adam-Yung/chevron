# tools/vite/htmlTransforms.js

HTML rewrites for the static profile, applied by the `chevron-static-html` plugin in `vite.config.js` (build only).

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
  font. The static build now carries Onest as a data URL (about 35 KB); comments in `public/font.css` are stripped first so the
  commented-out CJK example is never read as a real font.
