// One fresh browser context per spec, with every outside request stubbed so the suite is offline and deterministic.
const SUGGEST = /^https:\/\/www\.google\.com\/complete\/search/
const RATES = /^https:\/\/open\.er-api\.com\/v6\/latest\/(\w+)/

function suggestScript(url) {
  const params = new URL(url).searchParams
  const q = params.get('q') || ''
  const items = [`${q} one`, `${q} two`]
  const meta = { 'google:suggesttype': ['QUERY', 'QUERY'], 'google:suggestrelevance': [600, 500] }
  return `${params.get('callback')}(${JSON.stringify([q, items, [], [], meta])})`
}

async function stubOutside(context, navigations) {
  await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, route => {
    const request = route.request()
    const url = request.url()
    if (SUGGEST.test(url)) return route.fulfill({ contentType: 'text/javascript', body: suggestScript(url) })
    if (RATES.test(url)) {
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ result: 'success', rates: { USD: 1.1, EUR: 1, JPY: 160 } }) })
    }
    if (request.isNavigationRequest()) {
      navigations.push({ url, at: Date.now() })
      return route.fulfill({ contentType: 'text/html', body: `<title>outside</title><h1 id="outside">${url}</h1>` })
    }
    return route.abort()
  })
}

export async function openApp(browser, baseUrl, { viewport = { width: 1280, height: 800 }, settings, path = '' } = {}) {
  const context = await browser.newContext({ viewport })
  const navigations = []
  await stubOutside(context, navigations)
  if (settings) await context.addInitScript(s => { if (!localStorage.getItem('settings')) localStorage.setItem('settings', s) }, JSON.stringify(settings))
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()) })
  const app = {
    page, context, errors, navigations, baseUrl,
    async goto(extra = path) {
      await page.goto(baseUrl + extra)
      await page.waitForSelector('textarea[role="combobox"]')
    },
    view: () => page.getAttribute('[data-view]', 'data-view'),
    query: () => page.$eval('textarea[role="combobox"]', e => e.value),
    async waitView(view, timeout = 2000) {
      await page.waitForFunction(v => document.querySelector('[data-view]')?.dataset.view === v, view, { timeout })
    },
    async settle(ms = 400) { await page.waitForTimeout(ms) },
    close: () => context.close()
  }
  await app.goto()
  return app
}

export function assert(condition, message) {
  if (!condition) throw new Error(message)
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}
