// Weather chip and modal, cheatsheet, AI panel and the offline pill: stubbed APIs, no outside requests.
import { createServer } from 'node:http'
import { openApp, assert, assertEqual } from '../lib/app.mjs'

const KEY = '0123456789abcdef0123456789abcdef'
const WEATHER_SETTINGS = { weather: { apiKey: KEY, lat: '59.9', lon: '10.7', units: 'metric', forecastDays: 5 } }
const OWM = /^https:\/\/api\.openweathermap\.org\/data\/2\.5\/(weather|forecast)/

const currentBody = () => ({
  name: 'Oslo', visibility: 10000, wind: { speed: 3.4, deg: 200 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  main: { temp: 14.2, feels_like: 13, temp_min: 9, temp_max: 17, humidity: 61 }
})

function forecastBody() {
  const start = Math.floor(Date.now() / 10800000) * 10800
  const list = Array.from({ length: 40 }, (_, i) => ({
    dt: start + i * 10800,
    main: { temp: 8 + (i % 8) * 2, feels_like: 8, temp_min: 7, temp_max: 15, humidity: 60 },
    weather: [{ id: 801, main: 'Clouds', description: 'few clouds', icon: i % 8 < 3 ? '02n' : '02d' }]
  }))
  return { cod: '200', list, city: { name: 'Oslo' } }
}

// Counts OWM requests and answers them per `mode`: 'ok', 'error' (HTTP 500) or 'hang' (never answers).
async function stubWeather(context, mode = 'ok') {
  const calls = { current: 0, forecast: 0, mode }
  await context.route(OWM, route => {
    const kind = OWM.exec(route.request().url())[1] === 'weather' ? 'current' : 'forecast'
    calls[kind]++
    if (calls.mode === 'hang') return
    if (calls.mode === 'error') return route.fulfill({ status: 500, body: '{}' })
    const body = kind === 'current' ? currentBody() : forecastBody()
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
  })
  return calls
}

// Every spec opens its own app so settings can be seeded before the first load; the runner's default app stays idle.
async function launch(app, settings, options = {}) {
  const own = await openApp(app.context.browser(), app.baseUrl, { dist: app.dist, settings, ...options })
  own.checkErrors = () => assert(own.errors.length === 0, 'page errors: ' + own.errors.join(' | '))
  return own
}

async function withWeather(app, mode = 'ok', options = {}) {
  const own = await launch(app, WEATHER_SETTINGS, options)
  const calls = await stubWeather(own.context, mode)
  await own.goto()
  return { own, calls }
}

const dialog = page => page.$('[role="dialog"]')
const waitGone = (page, selector) => page.waitForSelector(selector, { state: 'detached', timeout: 1500 })
const focusedRole = page => page.evaluate(() => document.activeElement?.getAttribute('role'))
const noHorizontalScroll = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)

// The clock row, and with it the chip, lives in the sites menu layer, which is inert until the menu is open.
async function openWeatherModal(own) {
  if (await own.view() !== 'macros') {
    await own.page.keyboard.press('Shift')
    await own.waitView('macros')
  }
  await own.page.click('button[aria-label*="weather details"]')
  await own.page.waitForSelector('[role="dialog"][aria-label^="Weather in"]')
}

// ---------------------------------------------------------------- AI server

const delta = text => `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`

// A real local server, because Playwright cannot fulfil a response in timed chunks, and progressive rendering is the point.
function startAiServer() {
  const log = { requests: [], closed: [] }
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => {
      const messages = JSON.parse(raw).messages
      const question = messages[messages.length - 1].content
      log.requests.push(question)
      res.on('close', () => log.closed.push(question))
      respond(question, res)
    })
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => {
    resolve({ url: `http://127.0.0.1:${server.address().port}`, log, close: () => server.closeAllConnections?.() || server.close() })
  }))
}

function respond(question, res) {
  if (question.startsWith('unauthorized')) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: { code: 'invalid_api_key', message: 'Incorrect API key provided' } }))
  }
  if (question.startsWith('garbage')) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' })
    return res.end('data: <<not json>>\n\n: keep-alive\n\ndata: {oops\n\n')
  }
  res.writeHead(200, { 'Content-Type': 'text/event-stream' })
  const slow = question.startsWith('slow')
  const parts = slow ? ['OLD1 ', 'OLD2 ', 'OLD3 ', 'OLD4 ', 'OLD5 ', 'OLD6'] : ['alpha ', 'beta ', 'gamma']
  let i = 0
  const timer = setInterval(() => {
    if (i >= parts.length) { clearInterval(timer); res.write('data: [DONE]\n\n'); return res.end() }
    res.write(delta(parts[i++]))
  }, slow ? 400 : 350)
  res.on('close', () => clearInterval(timer))
}

const aiSettings = (url, extra = {}) => ({ query: { AI: { enabled: true, provider: 'ollama', baseURL: url, model: 'm', ...extra } } })

async function ask(own, text) {
  await own.page.keyboard.type(text)
  await own.page.keyboard.press('Space')
  await own.page.keyboard.press('Space')
}

const panelText = page => page.$eval('[data-testid="ai-panel"]', e => e.innerText).catch(() => null)
const withServer = async (app, settings, run) => {
  const server = await startAiServer()
  const own = await launch(app, settings(server.url))
  try { await run(own, server) } finally {
    await own.close()
    server.close()
  }
}

const HINTS = '[aria-hidden="true"][class*="overlay"]'
const pillOpacity = page => page.$eval('[data-testid="offline-pill"]', e => getComputedStyle(e).opacity)

export default {
  // ------------------------------------------------------------ weather
  async 'weather: chip shows stubbed temperature and uses the cache on reload'(app) {
    const { own, calls } = await withWeather(app)
    await own.page.waitForSelector('button[aria-label^="14°C"]')
    assertEqual(calls.current, 1, 'current requests')
    assertEqual(calls.forecast, 1, 'forecast requests')
    await own.goto()
    await own.page.waitForSelector('button[aria-label^="14°C"]')
    await own.settle(600)
    assertEqual(calls.current + calls.forecast, 2, 'requests after reload within the TTL')
    own.checkErrors()
    await own.close()
  },

  async 'weather: modal shows forecast, closes with Esc, X and backdrop, leaves nothing behind'(app) {
    const { own } = await withWeather(app)
    const { page } = own
    await page.waitForSelector('button[aria-label*="weather details"]')
    for (const how of ['Escape', 'x', 'backdrop']) {
      await openWeatherModal(own)
      assert((await page.$$('[role="dialog"] [class*="day-card"]')).length >= 4, 'forecast cards')
      if (how === 'Escape') await page.keyboard.press('Escape')
      else if (how === 'x') await page.click('button[aria-label="Close weather"]')
      else await page.mouse.click(5, 5)
      await waitGone(page, '[role="dialog"]')
    }
    own.checkErrors()
    await own.close()
  },

  async 'weather: opening the modal does not move the search field'(app) {
    const { own } = await withWeather(app)
    const { page } = own
    await page.waitForSelector('button[aria-label*="weather details"]', { state: 'attached' })
    await page.keyboard.press('Shift')
    await own.waitView('macros')
    const chip = page.locator('button[aria-label*="weather details"]')
    await own.settle(500)
    const before = await chip.boundingBox()
    await openWeatherModal(own)
    await page.keyboard.press('Escape')
    await waitGone(page, '[role="dialog"]')
    assertEqual(await own.view(), 'macros', 'sites menu still open after closing the dialog')
    const after = await chip.boundingBox()
    assertEqual(JSON.stringify(after), JSON.stringify(before), 'chip box')
    await own.close()
  },

  async 'weather: HTTP errors fail quietly and typing still works'(app) {
    const { own, calls } = await withWeather(app, 'error')
    await own.settle(500)
    assert(calls.current >= 1, 'weather was attempted')
    assertEqual((await own.page.$$('button[aria-label*="weather details"]')).length, 0, 'no chip without data')
    await own.page.keyboard.type('hello')
    assertEqual(await own.query(), 'hello', 'query text')
    own.checkErrors()
    await own.close()
  },

  async 'weather: a request that never answers does not block boot or input'(app) {
    const { own } = await withWeather(app, 'hang')
    await own.page.keyboard.type('still typing')
    assertEqual(await own.query(), 'still typing', 'query text')
    own.checkErrors()
    await own.close()
  },

  async 'weather: modal fits a phone screen'(app) {
    const { own } = await withWeather(app, 'ok', { viewport: { width: 390, height: 844 } })
    await own.page.waitForSelector('button[aria-label*="weather details"]')
    await openWeatherModal(own)
    const box = await (await dialog(own.page)).boundingBox()
    assert(box.x >= 0 && box.x + box.width <= 390, `modal within width: ${JSON.stringify(box)}`)
    assert(await noHorizontalScroll(own.page), 'no horizontal scroll')
    await own.close()
  },

  // ------------------------------------------------------------ cheatsheet
  async 'cheatsheet: ? on an empty field opens it, Esc closes it and focus returns to search'(app) {
    const own = await launch(app)
    await own.page.keyboard.press('?')
    await own.page.waitForSelector('[role="dialog"][aria-label="Keyboard shortcuts"]')
    await own.page.keyboard.press('Escape')
    await waitGone(own.page, '[role="dialog"]')
    assertEqual(await focusedRole(own.page), 'combobox', 'focus after Esc')
    own.checkErrors()
    await own.close()
  },

  async 'cheatsheet: ? with text in the field types a question mark instead'(app) {
    const own = await launch(app)
    await own.page.keyboard.type('what')
    await own.page.keyboard.press('?')
    assertEqual(await own.query(), 'what?', 'query text')
    assertEqual(await dialog(own.page), null, 'no dialog')
    await own.close()
  },

  async 'cheatsheet: corner button opens it; X and backdrop close it; focus returns to search'(app) {
    const own = await launch(app)
    for (const how of ['x', 'backdrop']) {
      await own.page.click('button[aria-label="Keyboard shortcuts"]')
      await own.page.waitForSelector('[role="dialog"]')
      if (how === 'x') await own.page.click('button[aria-label="Close cheatsheet"]')
      else await own.page.mouse.click(5, 5)
      await waitGone(own.page, '[role="dialog"]')
      assertEqual(await focusedRole(own.page), 'combobox', `focus after ${how}`)
    }
    own.checkErrors()
    await own.close()
  },

  async 'cheatsheet: rapid toggling ends in a consistent state with no overlay left'(app) {
    const own = await launch(app)
    for (let i = 0; i < 8; i++) {
      await own.page.keyboard.press('?')
      await own.page.keyboard.press('Escape')
    }
    await own.page.keyboard.press('?')
    await own.page.waitForSelector('[role="dialog"]')
    assertEqual((await own.page.$$('[role="dialog"]')).length, 1, 'one dialog')
    await own.page.keyboard.press('Escape')
    await waitGone(own.page, '[role="dialog"]')
    const covering = await own.page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      return el?.closest('[data-keep-focus]') !== null
    })
    assert(!covering, 'nothing covers the page after closing')
    await own.close()
  },

  async 'cheatsheet: fits a phone screen and lists the final keymap'(app) {
    const own = await launch(app, undefined, { viewport: { width: 390, height: 844 } })
    await own.page.click('button[aria-label="Keyboard shortcuts"]')
    await own.page.waitForSelector('[role="dialog"]')
    const text = (await own.page.$eval('[role="dialog"]', e => e.innerText)).toLowerCase()
    for (const phrase of ['search', 'sites menu', 'anywhere', 'ask the ai', 'new tab']) assert(text.includes(phrase), `lists ${phrase}`)
    const box = await (await dialog(own.page)).boundingBox()
    assert(box.x >= 0 && box.x + box.width <= 390, `dialog within width: ${JSON.stringify(box)}`)
    assert(await noHorizontalScroll(own.page), 'no horizontal scroll')
    await own.close()
  },

  // ------------------------------------------------------------ AI
  async 'ai: answer streams in progressively'(app) {
    await withServer(app, aiSettings, async own => {
      await ask(own, 'tell me')
      await own.page.waitForFunction(() => /alpha/.test(document.querySelector('[data-testid="ai-panel"]')?.innerText || ''), null, { timeout: 4000 })
      assert(!/gamma/.test(await panelText(own.page)), 'not complete yet when the first token shows')
      await own.page.waitForFunction(() => /gamma/.test(document.querySelector('[data-testid="ai-panel"]')?.innerText || ''), null, { timeout: 4000 })
      own.checkErrors()
    })
  },

  async 'ai: HTTP 401 shows a readable message'(app) {
    await withServer(app, aiSettings, async own => {
      await ask(own, 'unauthorized please')
      await own.page.waitForSelector('[role="alert"]')
      const text = await panelText(own.page)
      assert(/Incorrect API key provided/.test(text), 'server message shown: ' + text)
    })
  },

  async 'ai: unreachable endpoint shows a readable message'(app) {
    await withServer(app, () => aiSettings('http://127.0.0.1:9'), async own => {
      await ask(own, 'anyone there')
      await own.page.waitForSelector('[role="alert"]')
      assert(/Could not reach/.test(await panelText(own.page)), 'network message')
    })
  },

  async 'ai: a malformed stream ends in an error, not a stuck "thinking"'(app) {
    await withServer(app, aiSettings, async own => {
      await ask(own, 'garbage in')
      await own.page.waitForSelector('[role="alert"]')
      assert(!/thinking/.test(await panelText(own.page)), 'no thinking left')
    })
  },

  async 'ai: a new query aborts the old stream and the answers never interleave'(app) {
    await withServer(app, aiSettings, async (own, server) => {
      await ask(own, 'slow one')
      await own.page.waitForFunction(() => /OLD1/.test(document.querySelector('[data-testid="ai-panel"]')?.innerText || ''), null, { timeout: 4000 })
      await own.page.keyboard.press('Escape')
      for (let i = 0; i < 12; i++) await own.page.keyboard.press('Backspace')
      await own.page.keyboard.type('fast two')
      await own.page.keyboard.press('Space')
      await own.page.keyboard.press('Space')
      await own.page.waitForFunction(() => /gamma/.test(document.querySelector('[data-testid="ai-panel"]')?.innerText || ''), null, { timeout: 5000 })
      const text = await panelText(own.page)
      assert(!/OLD/.test(text), 'old answer absent: ' + text)
      assert(server.log.closed.some(q => q.startsWith('slow')), 'old request was cancelled')
    })
  },

  async 'ai: Esc closes the panel'(app) {
    await withServer(app, aiSettings, async own => {
      await ask(own, 'tell me')
      await own.page.waitForSelector('[data-testid="ai-panel"]')
      await own.page.keyboard.press('Escape')
      await waitGone(own.page, '[data-testid="ai-panel"]')
    })
  },

  async 'ai: sends nothing when the provider is not configured'(app) {
    await withServer(app, () => ({ query: { AI: { enabled: true, provider: 'ollama' } } }), async (own, server) => {
      await ask(own, 'hello there')
      await own.page.waitForFunction(() => /not configured/.test(document.querySelector('[data-testid="ai-panel"]')?.innerText || ''), null, { timeout: 3000 })
      assertEqual(server.log.requests.length, 0, 'requests sent')
    })
  },

  // ------------------------------------------------------------ onboarding
  async 'touch hints show while idle and go for good once the user leaves idle'(app) {
    const context = await app.context.browser().newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort())
    const page = await context.newPage()
    await page.goto(app.baseUrl)
    await page.waitForSelector('textarea[role="combobox"]')
    await page.waitForSelector(HINTS, { timeout: 2000 })
    await page.keyboard.type('x')
    await page.waitForSelector(HINTS, { state: 'detached', timeout: 2000 })
    assertEqual(await page.evaluate(() => localStorage.getItem('touchHintsSeen')), '1', 'seen flag')
    await page.reload()
    await page.waitForSelector('textarea[role="combobox"]')
    await page.waitForTimeout(400)
    assertEqual((await page.$$(HINTS)).length, 0, 'hints after reload')
    await context.close()
  },

  // ------------------------------------------------------------ offline
  async 'offline pill appears and disappears with the connection'(app) {
    const own = await launch(app)
    assertEqual(await pillOpacity(own.page), '0', 'hidden while online')
    await own.context.setOffline(true)
    await own.page.waitForFunction(() => /Offline/.test(document.querySelector('[data-testid="offline-pill"]')?.innerText) && getComputedStyle(document.querySelector('[data-testid="offline-pill"]')).opacity === '1')
    await own.context.setOffline(false)
    await own.page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="offline-pill"]')).opacity === '0')
    own.checkErrors()
    await own.close()
  }
}
