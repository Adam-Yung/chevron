// First visit to the hosted build: the first-paint shell in index.html paints the chevron before the bundle runs, keeps keys typed
// before mount and leaves without a stale frame; boot fetches only what the first screen needs. The gate builds dist-hosted before
// this suite.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { startStaticServer } from '../lib/server.mjs'
import { assert, assertEqual } from '../lib/app.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const hostedDist = process.env.E2E_HOSTED_DIST || join(root, 'dist-hosted')
const ENTRY = /\/assets\/index\.[^/]+\.js$/
const APP_CSS = /\/assets\/index\.[^/]+\.css$/
const WORKER = /\/assets\/chevron\.worker[^/]*\.js$/

// Opens the hosted build with requests matching `pattern` held until the returned release() is called.
async function openHeld(app, pattern) {
  assert(existsSync(join(hostedDist, 'index.html')), `no hosted build at ${hostedDist}; run vite build --mode hosted --outDir dist-hosted`)
  const server = await startStaticServer(hostedDist)
  const page = await app.context.newPage()
  let release
  const held = new Promise(resolve => { release = resolve })
  await page.route(pattern, async route => { await held; await route.continue().catch(() => {}) })
  page.goto(server.url).catch(() => {})
  await page.waitForSelector('#boot-shell svg')
  return { page, release, close: async () => { release(); await page.close(); server.close() } }
}

export default {
  async 'keys typed before the app mounts land in the search field'(app) {
    const held = await openHeld(app, ENTRY)
    try {
      const focused = await held.page.evaluate(() => document.activeElement?.id)
      assertEqual(focused, 'boot-input', 'focused element before mount')
      await held.page.keyboard.type('discard me')
      await held.page.keyboard.press('Escape')
      await held.page.keyboard.type('early bird')
      await held.page.keyboard.press('Enter')
      assertEqual(await held.page.$('textarea[role="combobox"]'), null, 'the app mounted before release')
      held.release()
      await held.page.waitForSelector('textarea[role="combobox"]')
      assertEqual(await held.page.$eval('textarea[role="combobox"]', e => e.value), 'early bird', 'query after mount')
      await held.page.keyboard.type('!')
      assertEqual(await held.page.$eval('textarea[role="combobox"]', e => e.value), 'early bird!', 'typing continues after mount')
    } finally {
      await held.close()
    }
  },

  async 'the shell paints while the app stylesheet loads, and the app waits for it'(app) {
    const held = await openHeld(app, APP_CSS)
    try {
      await held.page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0, null, { timeout: 3000 })
      await held.page.waitForTimeout(300)
      assertEqual(await held.page.$('textarea[role="combobox"]'), null, 'the app mounted without its stylesheet')
      held.release()
      await held.page.waitForSelector('textarea[role="combobox"]')
    } finally {
      await held.close()
    }
  },

  async 'the shell leaves once the worker has drawn the chevron'(app) {
    // Hosted draws in the worker and reports `painted`; boot.mjs covers the main-thread painter on file://.
    const held = await openHeld(app, /^$/)
    try {
      await held.page.waitForSelector('textarea[role="combobox"]')
      assertEqual(await held.page.$('#boot-input'), null, 'boot input after mount')
      await held.page.waitForSelector('#boot-shell', { state: 'detached', timeout: 3000 })
      assertEqual(await held.page.evaluate(() => document.querySelector('[data-view]')?.dataset.view), 'idle', 'view')
    } finally {
      await held.close()
    }
  },

  async 'the shell chevron never outlives the idle view'(app) {
    // With the chevron worker held, the canvas cannot draw; leaving idle must still remove the static idle chevron.
    const held = await openHeld(app, WORKER)
    try {
      await held.page.waitForSelector('textarea[role="combobox"]')
      assert(await held.page.$('#boot-shell'), 'shell should wait for the canvas while idle')
      await held.page.keyboard.type('x')
      await held.page.waitForSelector('#boot-shell', { state: 'detached', timeout: 1000 })
    } finally {
      await held.close()
    }
  },

  async 'boot does not fetch the cheatsheet chunk; opening it does'(app) {
    const held = await openHeld(app, /^$/)
    try {
      const fetched = []
      held.page.on('request', r => fetched.push(r.url()))
      await held.page.waitForSelector('textarea[role="combobox"]')
      await held.page.waitForTimeout(500)
      const early = fetched.concat(await held.page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name)))
      assert(!early.some(u => /Cheatsheet/.test(u)), 'cheatsheet fetched at boot')
      await held.page.keyboard.press('?')
      await held.page.waitForSelector('[role="dialog"][aria-label="Keyboard shortcuts"]')
    } finally {
      await held.close()
    }
  }
}
