// Workbox options for the hosted build's service worker. Kept apart from vite.config.js so they are unit-tested.
// docs/code/tools/vite/serviceWorker.js.md explains the choices.

// Workbox's defaults plus `v`: index.html asks for config.js?v=<version> and icons.js?v=<version>, but the precache stores them
// without the query, so without this rule they were never served offline.
const IGNORED_PARAMS = [/^utm_/, /^fbclid$/, /^v$/]

/**
 * @param {string} base  the deploy base path, e.g. '/chevron/' on GitHub Pages, '' for relative builds
 */
export function workboxOptions(base) {
  return {
    globPatterns: ['**/*.{html,js,css,svg,png,ico,woff,woff2,json}'],
    cleanupOutdatedCaches: true,
    ignoreURLParametersMatching: IGNORED_PARAMS,
    navigateFallback: `${base}index.html`
  }
}
