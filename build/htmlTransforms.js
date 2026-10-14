// Pure HTML-transform helpers used by the Vite plugins in vite.config.js.
// Extracted so they can be unit-tested without spinning up a full build.

/**
 * Normalise the built HTML for the hosted (IIFE) profile so it works from
 * both an HTTP server and the local filesystem (file://).
 *
 *  - Drops `crossorigin` from <script> tags only (Vite adds it for module
 *    CORS, which blocks file:// loads). Preserves `crossorigin` on
 *    <link rel="preload" as="font"> — a font preload MUST stay crossorigin
 *    or the browser issues a second, non-CORS fetch (double download).
 *  - Rewrites `<script type="module">` to `<script defer>` (IIFE output
 *    is not a module and would otherwise be CORS-gated).
 *  - Removes `<link rel="modulepreload">` hints (irrelevant to IIFE).
 *
 * @param {string} html
 * @returns {string}
 */
export function stripModuleMarkersFromHtml(html) {
  return html
    .replace(/<script\b([^>]*?)\s+crossorigin\b/g, '<script$1')
    .replace(/<script\s+type="module"\s+/g, '<script defer ')
    .replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '')
}
