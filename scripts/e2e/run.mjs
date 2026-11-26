#!/usr/bin/env node
// End-to-end suite: loads the built static page (dist/index.html) in Playwright Chromium and runs every spec in scripts/e2e/specs.
//   node scripts/e2e/run.mjs [filter]      run specs whose name contains `filter`
//   E2E_HEADED=1 node scripts/e2e/run.mjs  watch it run
//   E2E_DIST=/some/dir node scripts/e2e/run.mjs   test a static build written somewhere other than dist/
// playwright-core is resolved from, in order: $PLAYWRIGHT_CORE, the path in scripts/e2e/playwright-path.local (untracked), the
// project's node_modules (after scripts/owner/install-deps.sh --run). Nothing is downloaded: all outside requests are stubbed.
import { readdir } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { loadChromium } from './lib/playwright.mjs'
import { startStaticServer } from './lib/server.mjs'
import { openApp } from './lib/app.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const filter = process.argv[2] || ''
const dist = process.env.E2E_DIST || join(root, 'dist')

async function loadSpecs() {
  const dir = join(here, 'specs')
  const files = (await readdir(dir)).filter(f => f.endsWith('.mjs')).sort()
  const specs = []
  for (const file of files) {
    const mod = await import(pathToFileURL(join(dir, file)).href)
    for (const [name, fn] of Object.entries(mod.default)) specs.push({ name: `${file.replace('.mjs', '')} › ${name}`, fn })
  }
  return specs.filter(s => s.name.includes(filter))
}

async function runSpec(browser, server, spec) {
  const started = Date.now()
  const app = await openApp(browser, server.url, { dist })
  try {
    await spec.fn(app)
    if (app.errors.length) throw new Error('page errors: ' + app.errors.join(' | '))
    return { ok: true, ms: Date.now() - started }
  } catch (error) {
    await app.page.screenshot({ path: join(dist, `e2e-failure-${spec.name.replace(/\W+/g, '_')}.png`) }).catch(() => {})
    return { ok: false, ms: Date.now() - started, error }
  } finally {
    await app.close()
  }
}

async function main() {
  const chromium = await loadChromium(root)
  if (!chromium) {
    console.error('e2e: playwright-core not found. Run scripts/owner/install-deps.sh --run, or set PLAYWRIGHT_CORE.')
    process.exit(1)
  }
  const server = await startStaticServer(dist)
  const browser = await chromium.launch({ headless: !process.env.E2E_HEADED })
  const specs = await loadSpecs()
  let failed = 0
  for (const spec of specs) {
    const result = await runSpec(browser, server, spec)
    console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${spec.name} (${result.ms} ms)`)
    if (result.ok) continue
    failed++
    console.log('     ' + String(result.error?.stack || result.error).split('\n').slice(0, 4).join('\n     '))
  }
  await browser.close()
  server.close()
  console.log(`e2e: ${specs.length - failed}/${specs.length} passed`)
  process.exit(failed ? 1 : 0)
}

main().catch(error => { console.error(error); process.exit(1) })
