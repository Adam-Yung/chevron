/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { stripModuleMarkersFromHtml } from './build/htmlTransforms.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf8'))
const APP_VERSION = pkg.version || '0.0.0'

/* Two build profiles, both produced by `vite build`:
 *
 *   build:static  – inlines every JS / CSS chunk into a single IIFE HTML
 *                   file via `vite-plugin-singlefile` (then stripModuleMarkers
 *                   removes type=module/crossorigin for file:// use). This is
 *                   the artifact shipped in the GitHub release zip and used by
 *                   the local Express bundle.
 *
 *   build:hosted  – real ES-module output with code splitting. React.lazy
 *                   boundaries (Settings, Weather, Cheatsheet, AIcompletion,
 *                   MacrosMenu) and big vendors (react, framer-motion, splide,
 *                   minisearch) emit as separate content-hashed chunks that
 *                   load on demand and cache forever. VitePWA precaches them
 *                   all. GitHub Pages serves over HTTP so modules load fine.
 *                   Helper scripts in /public are versioned via `?v=<ver>`.
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
    transformIndexHtml: stripModuleMarkersFromHtml
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
      // Build-profile-specific plugins:
      //
      //   Hosted (GitHub Pages, HTTP): real ES-module output with code
      //   splitting (see rollupOptions below). VitePWA/Workbox generates
      //   sw.js + a versioned precache of every emitted chunk so repeat and
      //   offline visits are served from local cache. No stripModuleMarkers
      //   here — we WANT type="module"/crossorigin so lazy chunks load.
      //
      //   Static (portable, file://): single IIFE inlined into one HTML file
      //   by vite-plugin-singlefile, then stripModuleMarkers drops
      //   type="module"/crossorigin so it also runs from the local
      //   filesystem (browsers CORS-gate module loads over file://).
      ...(isHosted ? [
        VitePWA({
          // Auto-update: a new deploy silently installs its fresh precache and
          // takes over on the next navigation. No in-app prompt needed.
          registerType: 'autoUpdate',
          // 'inline' injects a tiny classic (non-module) registration snippet
          // directly into index.html, avoiding an extra registerSW.js file.
          injectRegister: 'inline',
          // Chevron already ships public/manifest.json and links it from
          // index.html; don't let the plugin emit a second manifest.
          manifest: false,
          workbox: {
            // Precache the full app shell + all code-split chunks. The web
            // worker, fonts and public helper scripts are emitted into dist,
            // so cover them too.
            globPatterns: ['**/*.{html,js,css,svg,png,ico,woff,woff2,json}'],
            // Drop precaches from previous deploys to avoid unbounded growth.
            cleanupOutdatedCaches: true,
            // SPA fallback must be base-aware: GitHub Pages serves from
            // /chevron/, so the fallback document is /chevron/index.html.
            navigateFallback: `${base}index.html`
          }
        })
      ] : [viteSingleFile(), stripModuleMarkers()])
    ],
    base,
    preview: {
      host: '::'
    },
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION)
    },
    test: {
      // Unit tests run under jsdom so hooks/classes that touch the DOM and
      // localStorage work without a real browser. See src/**/*.test.{js,jsx}.
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}', 'test/**/*.{test,spec}.{js,jsx}']
    },
    build: {
      // Raise the warning limit; the static single-file bundle is ~580 KB.
      chunkSizeWarningLimit: 700,
      rollupOptions: isHosted
        ? {
            // Hosted (HTTP): real ES-module output so React.lazy boundaries
            // (Settings/MUI-Joy, Weather, Cheatsheet, AIcompletion,
            // MacrosMenu) split into separate chunks that load on demand
            // instead of being inlined into the entry. Vendors are grouped
            // so the big, rarely-changing libraries cache independently of
            // app code. Content-hashed names → cache-forever + SW precache.
            output: {
              format: 'es',
              entryFileNames: 'assets/[name].[hash].js',
              chunkFileNames: 'assets/[name].[hash].js',
              assetFileNames: 'assets/[name].[hash][extname]',
              manualChunks(id) {
                if (!id.includes('node_modules')) return undefined
                if (id.includes('react-dom') || /node_modules\/(react|scheduler)\//.test(id)) {
                  return 'react-vendor'
                }
                if (id.includes('framer-motion')) return 'framer-motion'
                if (id.includes('@splidejs')) return 'splide'
                if (id.includes('minisearch')) return 'minisearch'
                return 'vendor'
              }
            }
          }
        : {
            // Static (file://): single IIFE so the browser doesn't apply
            // module CORS rules. inlineDynamicImports collapses lazy chunks
            // into one file (IIFE can't code-split); singlefile then inlines
            // it into index.html.
            output: {
              format: 'iife',
              inlineDynamicImports: true,
              entryFileNames: 'assets/[name].[hash].js',
              assetFileNames: 'assets/[name].[hash][extname]'
            }
          }
    }
  }
})
