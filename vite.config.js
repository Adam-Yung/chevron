import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
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

export default defineConfig(({ mode }) => {
  const target = resolveTarget(mode)
  const isHosted = target === 'hosted'
  return {
    plugins: [
      react(),
      publicCacheBust(),
      // Only inline everything for the static profile. The hosted profile
      // wants real chunks so the browser can cache them.
      ...(isHosted ? [] : [viteSingleFile()])
    ],
    base: '',
    define: {
      __APP_VERSION__: JSON.stringify(APP_VERSION)
    },
    build: {
      // Vite already content-hashes asset filenames by default; the rollup
      // output options below just make the names a touch more readable when
      // inspecting the hosted bundle.
      rollupOptions: isHosted ? {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      } : undefined
    }
  }
})
