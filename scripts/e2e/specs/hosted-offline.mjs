// The hosted build's service worker: a reload with no network boots from the precache, and a new deploy reaches an open tab on
// its next load. Each spec serves its own copy of dist-hosted, which the gate builds before this suite.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { startStaticServer } from '../lib/server.mjs'
import { assert, assertEqual } from '../lib/app.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const hostedDist = process.env.E2E_HOSTED_DIST || join(root, 'dist-hosted')
const QUERY = 'textarea[role="combobox"]'

async function serveCopy(app) {
  const dir = mkdtempSync(join(tmpdir(), 'chevron-hosted-'))
  cpSync(hostedDist, dir, { recursive: true })
  const server = await startStaticServer(dir)
  const page = await app.context.newPage()
  await page.goto(server.url)
  await page.waitForSelector(QUERY)
  await page.evaluate(() => navigator.serviceWorker.ready)
  return { dir, server, page, close: async () => { await page.close(); server.close(); rmSync(dir, { recursive: true, force: true }) } }
}

// A deploy that changes only index.html: the page gets a marker, and the service worker a new revision for it.
function deployMarker(dir) {
  const html = join(dir, 'index.html')
  writeFileSync(html, readFileSync(html, 'utf8').replace('</head>', '<meta name="e2e-deploy" content="2"></head>'))
  const sw = join(dir, 'sw.js')
  writeFileSync(sw, readFileSync(sw, 'utf8').replace(/(url:"index\.html",revision:")[^"]+/, '$1e2e-deploy-2'))
}

export default {
  async 'hosted: a reload with no network boots from the service worker'(app) {
    const site = await serveCopy(app)
    try {
      // GitHub Pages lets the HTTP cache keep files for 10 minutes; clearing it proves the service worker alone serves them.
      const cdp = await app.context.newCDPSession(site.page)
      await cdp.send('Network.clearBrowserCache')
      await app.context.setOffline(true)
      const failed = []
      site.page.on('requestfailed', r => failed.push(r.url()))
      await site.page.reload()
      await site.page.waitForSelector(QUERY)
      await site.page.keyboard.type('offline')
      assertEqual(await site.page.$eval(QUERY, e => e.value), 'offline', 'typing after an offline reload')
      assertEqual(failed.join(', '), '', 'requests that failed offline')
      const hasMacros = await site.page.evaluate(() => Array.isArray(window.CONFIG?.macros) && window.ICONS != null)
      assert(hasMacros, 'config.js or icons.js missing offline')
    } finally {
      await app.context.setOffline(false)
      await site.close()
    }
  },

  async 'hosted: a new deploy reaches an open tab on its next load'(app) {
    const site = await serveCopy(app)
    try {
      deployMarker(site.dir)
      // A browser checks sw.js on navigation; update() is that same check, made now rather than at the browser's moment.
      const updated = await site.page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration()
        const before = reg.active
        await reg.update()
        for (let i = 0; i < 100 && (reg.installing || reg.waiting || reg.active === before); i++) await new Promise(r => setTimeout(r, 100))
        return reg.active !== before
      })
      assert(updated, 'the new service worker did not activate (skipWaiting)')
      let marker = null
      for (let i = 0; i < 3 && !marker; i++) {
        await site.page.reload()
        await site.page.waitForSelector(QUERY)
        marker = await site.page.$('meta[name="e2e-deploy"]')
      }
      assert(marker, 'the new deploy never reached the tab')
      await site.page.keyboard.type('fresh')
      assertEqual(await site.page.$eval(QUERY, e => e.value), 'fresh', 'typing after the update')
    } finally {
      await site.close()
    }
  }
}
