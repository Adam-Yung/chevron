# vite.config.js

- **Static profile (default):** one IIFE inlined into `dist/index.html` by `vite-plugin-singlefile`. IIFE because browsers refuse
  module scripts from `file://`; inlined because a `file://` page cannot load sibling chunks reliably either. The HTML is then fixed
  up by `tools/vite/htmlTransforms.js` (bundle after `config.js` and `icons.js`, no module markers). The plugin itself turns code
  splitting off, so the config does not repeat it.
- **Hosted profile:** real ES modules split by lazy boundary (settings, weather, AI, cheatsheet, sites menu) with React and Splide
  in their own long-cached chunks; Workbox precaches everything so a repeat visit is served offline.
  `public/font.css` is inlined into the HTML (`inlineFontCss`): as its own file it was a render-blocking request that only declared
  `@font-face`. The font file stays external and preloaded, so it is cached once rather than re-sent inside every HTML response.
  The app stylesheet moves below the first-paint shell (`moveAppStylesheetsAfterShell`), so the shell paints without waiting for it.
- `config.js` and `icons.js` are plain scripts in `public/` so users can edit them without a build; the version query busts caches.
- Vite 8 bundles with Rolldown, so build output options sit under `build.rolldownOptions`; `manualChunks` keeps the vendor split.
