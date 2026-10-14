import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'))
const APP_VERSION = pkg.version || '0.0.0'

/* Two build profiles, both produced by `vite build` (Phase 6):
 *
 *   build:static  – inlines every JS / CSS chunk into a single HTML file
 *                   via `vite-plugin-singlefile`. This is the artifact
 *                   shipped in the GitHub release zip and the one used by
 *                   the local Express bundle.
 *
 *   build:hosted  – default multi-chunk Vite output. Each chunk is named
 *                   with a content hash so the browser can cache forever.
 *                   When the version in package.json bumps, the helper
 *                   scripts in /public are also versioned via `?v=<ver>`
 *                   so they are re-fetched even though their filename
 *                   never changes.
 *
 * Pick the profile via `VITE_BUILD_TARGET=static|hosted vite build` (the
 * `build:*` package.json scripts wire that up).
 */
// `vite build --mode hosted` selects the hosted profile; everything else
// (default mode, dev server) keeps the historical single-file output.
function resolveTarget(mode) {
  if (mode === 'hosted' || process.env.VITE_BUILD_TARGET === 'hosted') return 'hosted'
  return 'static'
}

// Append `?v=<package version>` to the two `<script src="…">` tags that
// reference helper files served from /public. They have stable filenames
// (so userland config.js / icons.js paths don't change), but we still
// want the browser to drop its cached copy when the app version bumps.
function publicCacheBust() {
  const tagRe = /<script\s+src="(config\.js|icons\.js)"><\/script>/g
  return {
    name: 'chevron-public-cache-bust',
    transformIndexHtml(html) {
      return html.replace(tagRe, (_, file) => {
        return `<script src="${file}?v=${APP_VERSION}"></script>`
      })
    }
  }
}

// Strip the `crossorigin` attribute and `type="module"` from <script>
// tags in the built HTML. Browsers enforce CORS on ES module loads, which
// blocks the page entirely when opened from file://. By emitting the JS
// as IIFE (see rollupOptions below) and dropping these attributes, the
// hosted build works both from an HTTP server and from the local filesystem.
function stripModuleMarkers() {
  return {
    name: 'chevron-strip-module-markers',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/\s+crossorigin/g, '')
        .replace(/<script\s+type="module"\s+/g, '<script defer ')
        .replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '')
    }
  }
}

export default defineConfig(({ mode }) => {
  const target = resolveTarget(mode)
  const isHosted = target === 'hosted'
  // GitHub Pages serves from /chevron/ subpath. CI sets VITE_BASE to ensure
  // asset URLs resolve correctly (Vite's IIFE new URL() fallback uses
  // document.baseURI when document.currentScript is unavailable).
  // Local/file:// builds keep '' (relative paths) so they work anywhere.
  const base = process.env.VITE_BASE || ''
  return {
    plugins: [
      react(),
      publicCacheBust(),
      // Hosted (GitHub Pages) build only:
      //   1. VitePWA — Workbox generates sw.js + a versioned precache of the
      //      app shell so repeat/offline visits are served from local cache
      //      with no network round-trip. Must run BEFORE stripModuleMarkers so
      //      the post-pass can normalise anything VitePWA injects into the HTML.
      //   2. stripModuleMarkers — drops type="module"/crossorigin so the IIFE
      //      bundle also works from file://.
      // The static build stays an ES module inlined by vite-plugin-singlefile.
      ...(isHosted ? [
        VitePWA({
          // Auto-update: a new deploy silently installs its fresh precache and
          // takes over on the next navigation. No in-app prompt needed.
          registerType: 'autoUpdate',
          // 'inline' injects a tiny classic (non-module) registration snippet
          // directly into index.html. This avoids emitting an extra
          // type="module" registerSW.js that would clash with Chevron's
          // IIFE / file:// strategy and the stripModuleMarkers post-pass.
          injectRegister: 'inline',
          // Chevron already ships public/manifest.json and links it from
          // index.html; don't let the plugin emit a second manifest.
          manifest: false,
          workbox: {
            // Precache the full app shell. The web worker, fonts and public
            // helper scripts are all emitted into dist, so cover them too.
            globPatterns: ['**/*.{html,js,css,svg,png,ico,woff,woff2,json}'],
            // Drop precaches from previous deploys to avoid unbounded growth.
            cleanupOutdatedCaches: true,
            // SPA fallback must be base-aware: GitHub Pages serves from
            // /chevron/, so the fallback document is /chevron/index.html.
            navigateFallback: `${base}index.html`
          }
        }),
        stripModuleMarkers()
      ] : [viteSingleFile()])
    ],
    base,
    preview: {
      host: '::'
    },
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION)
    },
    build: {
      // The hosted IIFE bundle is ~580 KB which exceeds Vite's default
      // 500 KB warning. This is acceptable for a start page that loads
      // once and caches forever.
      chunkSizeWarningLimit: 700,
      // Hosted build uses IIFE format so the browser doesn't apply module
      // CORS rules — critical for file:// usage. inlineDynamicImports
      // collapses lazy chunks into one file (IIFE can't do code-splitting).
      rollupOptions: isHosted ? {
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      } : undefined
    }
  }
})
