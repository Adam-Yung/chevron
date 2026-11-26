# tools/vite/serviceWorker.js

Workbox options for the hosted profile's service worker, passed to `vite-plugin-pwa` by `vite.config.js`.

- **Why precache everything (`globPatterns`):** the brief promises offline use; a repeat visit, online or not, is served from the
  precache, including lazy panels a user has not opened yet.
- **Why ignore the `v` query parameter:** `config.js` and `icons.js` keep stable names because users edit them, so `index.html`
  requests them as `config.js?v=<version>` to bust the HTTP cache. Workbox precaches them without the query and, by default, only
  strips `utm_*` and `fbclid` before matching. The versioned requests therefore missed the precache: every repeat visit fetched them
  from the network, and offline (once the 10-minute GitHub Pages HTTP cache had expired) both failed and the app booted with no
  default macros, engines or icons. The precache's own revision hashes already replace stale copies on each deploy.
- **Why `navigateFallback` uses the base:** GitHub Pages serves the app under `/chevron/`, so the shell must be looked up there.

Tests: `tools/vite/serviceWorker.test.js`.
