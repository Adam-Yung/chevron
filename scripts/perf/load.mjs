#!/usr/bin/env node
// Load-time measurement in Playwright Chromium, cold (fresh profile) and warm (service worker installed), at three network speeds,
// plus an offline-reload check. Target is a URL (the deployed site) or a build folder, served locally.
//   node scripts/perf/load.mjs https://adam-yung.github.io/chevron/
//   node scripts/perf/load.mjs dist-hosted [--runs 3] [--out report.json]
// Only timings and response headers are recorded; no response body is saved. docs/code/scripts/perf/load.mjs.md explains the numbers.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { loadChromium } from '../e2e/lib/playwright.mjs'
import { startStaticServer } from '../e2e/lib/server.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

// Chrome DevTools' presets, in bytes per second.
const NETWORKS = {
  unthrottled: null,
  fast4g: { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 },
  slow4g: { offline: false, latency: 400, downloadThroughput: 400e3 / 8, uploadThroughput: 400e3 / 8 }
}

function option(name, fallback) {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : fallback
}

async function resolveTarget(target) {
  if (/^https?:/.test(target)) return { url: target, close: () => {} }
  return startStaticServer(resolve(target))
}

function observeVitals() {
  window.__cls = 0
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value
  }).observe({ type: 'layout-shift', buffered: true })
}

function readVitals() {
  const nav = performance.getEntriesByType('navigation')[0]
  const paints = Object.fromEntries(performance.getEntriesByType('paint').map(p => [p.name, Math.round(p.startTime)]))
  return {
    ttfb: Math.round(nav.responseStart),
    fcp: paints['first-contentful-paint'] ?? null,
    load: Math.round(nav.loadEventEnd),
    cls: Number(window.__cls.toFixed(4)),
    swControlled: Boolean(navigator.serviceWorker?.controller)
  }
}

function recordResponses(page, base) {
  const rows = []
  page.on('response', r => {
    const h = r.headers()
    rows.push({ path: r.url().replace(base, ''), status: r.status(), fromSW: r.fromServiceWorker(), cache: h['cache-control'], encoding: h['content-encoding'] })
  })
  return rows
}

async function loadOnce(context, url, network) {
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.enable')
  if (network) await cdp.send('Network.emulateNetworkConditions', network)
  const responses = recordResponses(page, url)
  await page.addInitScript(observeVitals)
  const started = Date.now()
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForSelector('textarea[role="combobox"]', { state: 'visible', timeout: 60000 })
  const inputVisible = Date.now() - started
  await page.waitForTimeout(1500)
  const vitals = await page.evaluate(readVitals)
  await page.close()
  return { ...vitals, inputVisible, responses }
}

async function offlineReload(browser, url) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(4000)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Network.clearBrowserCache')
  await context.setOffline(true)
  const failed = []
  page.on('requestfailed', r => failed.push(r.url().replace(url, '')))
  page.on('pageerror', e => failed.push(`error: ${e.message}`))
  await page.reload({ waitUntil: 'load' }).catch(e => failed.push(`reload: ${e.message}`))
  const inputVisible = await page.locator('textarea[role="combobox"]').isVisible()
  await context.close()
  return { inputVisible, failed }
}

async function measure(browser, url, runs) {
  const results = []
  for (const [name, network] of Object.entries(NETWORKS)) {
    for (let i = 1; i <= runs; i++) {
      const context = await browser.newContext()
      results.push({ network: name, visit: 'cold', run: i, ...await loadOnce(context, url, network) })
      await new Promise(r => setTimeout(r, 2500)) // let the service worker finish precaching
      results.push({ network: name, visit: 'warm', run: i, ...await loadOnce(context, url, network) })
      await context.close()
    }
  }
  return results
}

function print(results, offline) {
  for (const r of results) {
    const label = `${r.network} ${r.visit} #${r.run}`.padEnd(20)
    console.log(`${label} ttfb ${r.ttfb}  fcp ${r.fcp}  input ${r.inputVisible}  cls ${r.cls}  sw ${r.swControlled}  requests ${r.responses.length}`)
  }
  console.log(`offline reload: input ${offline.inputVisible ? 'visible' : 'MISSING'}; failed: ${offline.failed.join(', ') || 'none'}`)
}

async function main() {
  const target = process.argv[2]
  if (!target) {
    console.error('usage: node scripts/perf/load.mjs <url | build dir> [--runs N] [--out report.json]')
    process.exit(2)
  }
  const chromium = await loadChromium(root)
  if (!chromium) {
    console.error('perf: playwright-core not found; see scripts/e2e/run.mjs')
    process.exit(1)
  }
  const server = await resolveTarget(target)
  const browser = await chromium.launch({ headless: true })
  try {
    const results = await measure(browser, server.url, Number(option('--runs', 3)))
    const offline = await offlineReload(browser, server.url)
    print(results, offline)
    const out = option('--out')
    if (out) writeFileSync(out, JSON.stringify({ target, at: new Date().toISOString(), results, offline }, null, 2))
  } finally {
    await browser.close()
    server.close()
  }
}

main()
