/// <reference types="vitest" />
// Two build profiles; docs/code/vite.config.js.md explains each choice.
//   static (default): one self-contained index.html that runs from file://, a local server or Termux.
//   hosted (`--mode hosted`): ES modules split into cacheable chunks, plus a service worker for repeat and offline visits.
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { inlineFontCss, inlineFonts, prepareStaticHtml } from './tools/vite/htmlTransforms.js'

const root = dirname(fileURLToPath(import.meta.url))
const APP_VERSION = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version || '0.0.0'

// config.js and icons.js keep stable names (users edit them), so a version query is what makes browsers drop stale copies.
function publicCacheBust() {
  const tag = /<script\s+src="(config\.js|icons\.js)"><\/script>/g
  return {
    name: 'chevron-public-cache-bust',
    transformIndexHtml: html => html.replace(tag, (_, file) => `<script src="${file}?v=${APP_VERSION}"></script>`)
  }
}

function readFonts() {
  const css = readFileSync(resolve(root, 'public/font.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const urls = [...css.matchAll(/url\('([^']+\.woff2)'\)/g)].map(m => m[1])
  return { css, files: Object.fromEntries(urls.map(u => [u, readFileSync(resolve(root, 'public', u)).toString('base64')])) }
}

function staticHtml() {
  return {
    name: 'chevron-static-html',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      const fonts = readFonts()
      return inlineFonts(prepareStaticHtml(html), fonts.css, fonts.files)
    }
  }
}

function hostedHtml() {
  return {
    name: 'chevron-hosted-html',
    apply: 'build',
    transformIndexHtml: html => inlineFontCss(html, readFileSync(resolve(root, 'public/font.css'), 'utf8'))
  }
}

function hostedPlugins(base) {
  return [hostedHtml(), VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'inline',
    manifest: false,
    workbox: {
      globPatterns: ['**/*.{html,js,css,svg,png,ico,woff,woff2,json}'],
      cleanupOutdatedCaches: true,
      navigateFallback: `${base}index.html`
    }
  })]
}

function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor'
  if (id.includes('@splidejs')) return 'splide'
  return 'vendor'
}

const hostedOutput = {
  format: 'es',
  entryFileNames: 'assets/[name].[hash].js',
  chunkFileNames: 'assets/[name].[hash].js',
  assetFileNames: 'assets/[name].[hash][extname]',
  manualChunks: vendorChunk
}

const staticOutput = {
  format: 'iife',
  entryFileNames: 'assets/[name].[hash].js',
  assetFileNames: 'assets/[name].[hash][extname]'
}

export default defineConfig(({ mode }) => {
  const hosted = mode === 'hosted' || process.env.VITE_BUILD_TARGET === 'hosted'
  // GitHub Pages serves from /chevron/ and CI sets VITE_BASE; local and file:// builds use relative paths.
  const base = process.env.VITE_BASE || ''
  return {
    plugins: [react(), publicCacheBust(), ...(hosted ? hostedPlugins(base) : [viteSingleFile(), staticHtml()])],
    base,
    preview: { host: '::' },
    define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./test/setup.js'],
      include: ['src/**/*.{test,spec}.{js,jsx}', 'test/**/*.{test,spec}.{js,jsx}', 'tools/**/*.{test,spec}.{js,jsx}']
    },
    build: {
      chunkSizeWarningLimit: 700,
      rolldownOptions: { output: hosted ? hostedOutput : staticOutput }
    }
  }
})
