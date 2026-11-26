// The settings panel: opens and closes cleanly by every route, hands the keyboard back, applies edits live, persists them, and
// survives a damaged store.
import { assert, assertEqual } from '../lib/app.mjs'

const GEAR = '[aria-label="Open settings"]'
const DIALOG = '[role="dialog"][aria-label="Settings"]'
const SEARCH = 'textarea[role="combobox"]'

async function openPanel(app) {
  await app.page.click(GEAR)
  await app.page.waitForSelector(DIALOG)
}

async function assertClosed(app) {
  await app.page.waitForSelector(DIALOG, { state: 'detached', timeout: 2000 })
}

// Closing must leave typing wired to the search field, whatever route closed the panel.
async function assertTypingReachesSearch(app, text) {
  await app.page.keyboard.type(text)
  assertEqual(await app.query(), text, 'query text after closing settings')
  await app.page.fill(SEARCH, '')
}

const tab = (app, name) => app.page.click(`${DIALOG} [role="tab"]:text-is("${name}")`)
const row = (app, title) => app.page.locator(`${DIALOG} [class*="_row_"]`).filter({ hasText: title }).first()

async function storedSettings(app) {
  await app.page.waitForTimeout(450)
  return app.page.evaluate(() => JSON.parse(localStorage.getItem('settings') || '{}'))
}

export default {
  async 'close button, Esc and a click outside each close it and return typing to search'(app) {
    await openPanel(app)
    await app.page.click(`${DIALOG} [aria-label="Close settings"]`)
    await assertClosed(app)
    await assertTypingReachesSearch(app, 'one')

    await openPanel(app)
    await app.page.keyboard.press('Escape')
    await assertClosed(app)
    await assertTypingReachesSearch(app, 'two')

    await openPanel(app)
    await app.page.mouse.click(5, 5)
    await assertClosed(app)
    await assertTypingReachesSearch(app, 'three')
  },

  async 'Esc closes after the user clicked a non-focusable part of the panel'(app) {
    await openPanel(app)
    await app.page.click(`${DIALOG} h2`)
    await app.page.keyboard.press('Escape')
    await assertClosed(app)
  },

  async 'rapid open and close leaves nothing behind'(app) {
    for (let i = 0; i < 8; i++) {
      await app.page.click(GEAR)
      await app.page.keyboard.press('Escape')
    }
    await app.page.waitForTimeout(500)
    assertEqual(await app.page.locator(DIALOG).count(), 0, 'dialogs left after rapid toggling')
    await openPanel(app)
    const opacity = await app.page.$eval(DIALOG, e => getComputedStyle(e).opacity)
    assertEqual(opacity, '1', 'dialog opacity after reopening')
  },

  async 'every category renders controls without errors'(app) {
    await openPanel(app)
    const tabs = await app.page.$$eval(`${DIALOG} [role="tab"]`, els => els.map(e => e.textContent.trim()))
    assert(tabs.length >= 6, 'expected at least 6 tabs, got ' + tabs.join(','))
    for (const name of tabs) {
      await tab(app, name)
      const text = await app.page.$eval(`${DIALOG} [role="tabpanel"]`, e => e.textContent)
      assert(text.length > 10, `tab ${name} is empty`)
    }
    await app.page.keyboard.press('Escape')
    await assertClosed(app)
  },

  async 'a text setting applies live and survives a reload'(app) {
    await openPanel(app)
    await row(app, 'Tab Title').locator('input[type="text"]').fill('Start here')
    assertEqual(await app.page.title(), 'Start here', 'live tab title')
    assertEqual((await storedSettings(app)).general.tabTitle, 'Start here', 'stored tab title')
    await app.page.reload()
    await app.page.waitForSelector(SEARCH)
    assertEqual(await app.page.title(), 'Start here', 'tab title after reload')
  },

  async 'the new-tab switch is visible, labelled, and persists'(app) {
    await openPanel(app)
    const switchRow = row(app, 'Open results in a new tab')
    const toggle = switchRow.locator('[role="switch"]')
    assertEqual(await toggle.getAttribute('aria-checked'), 'false', 'switch starts off')
    await toggle.click()
    assertEqual(await toggle.getAttribute('aria-checked'), 'true', 'switch after click')
    assertEqual((await storedSettings(app)).general.redirectTarget, '_blank', 'stored redirect target')
  },

  async 'the dock switch exists in Appearance and defaults on'(app) {
    await openPanel(app)
    await tab(app, 'Appearance')
    const toggle = row(app, 'Show your pinned sites along the bottom').locator('[role="switch"]')
    assertEqual(await toggle.getAttribute('aria-checked'), 'true', 'dock default')
    await toggle.click()
    assertEqual((await storedSettings(app)).appearance.dock, false, 'stored dock')
  },

  async 'animation speed defaults to 250 and a number field can be cleared and retyped'(app) {
    await openPanel(app)
    const input = row(app, 'Animation Speed').locator('input[type="number"]')
    assertEqual(await input.inputValue(), '250', 'default animation speed')
    await input.fill('')
    assertEqual(await input.inputValue(), '', 'field stays empty while editing')
    await input.fill('100')
    assertEqual((await storedSettings(app)).general.animationSpeed, 100, 'stored animation speed')
    await input.fill('')
    await input.blur()
    assertEqual(await input.inputValue(), '100', 'blur restores the stored value')
  },

  async 'a pending edit is flushed when the page is hidden'(app) {
    await openPanel(app)
    await row(app, 'Tab Title').locator('input[type="text"]').fill('Flushed')
    await app.page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
    const stored = await app.page.evaluate(() => JSON.parse(localStorage.getItem('settings')))
    assertEqual(stored.general.tabTitle, 'Flushed', 'stored right after pagehide')
  },

  async 'corrupt stored settings fall back to defaults and keep a backup'(app) {
    for (const bad of ['{not json', '"text"', '[1,2]', '{"appearance":"x","general":{"animationSpeed":"fast"},"query":null}']) {
      await app.page.evaluate(value => { localStorage.setItem('settings', value) }, bad)
      await app.page.reload()
      await app.page.waitForSelector(SEARCH)
      await app.page.keyboard.type('ok')
      assertEqual(await app.query(), 'ok', `typing after booting on ${bad}`)
      await app.page.fill(SEARCH, '')
      await app.page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
    }
    const backups = await app.page.evaluate(() => Object.keys(localStorage).filter(k => /^chevron\.(corrupt|settings\.bak)/.test(k)))
    assert(backups.length >= 1, 'expected a backup of the damaged settings')
    await openPanel(app)
    assertEqual(await row(app, 'Animation Speed').locator('input[type="number"]').inputValue(), '250', 'default after corrupt store')
  },

  async 'narrow viewport: the panel fits and still closes'(app) {
    await app.page.setViewportSize({ width: 390, height: 844 })
    await openPanel(app)
    const box = await app.page.$eval(DIALOG, e => {
      const r = e.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    })
    assert(box.left >= 0 && box.right <= 390 && box.top >= 0 && box.bottom <= 844, 'dialog overflows the viewport: ' + JSON.stringify(box))
    const overflow = await app.page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert(!overflow, 'page scrolls horizontally with the panel open')
    await app.page.click(`${DIALOG} [aria-label="Close settings"]`)
    await assertClosed(app)
  },

  async 'the colour picker opens fully inside the panel and applies a colour'(app) {
    await openPanel(app)
    await tab(app, 'Appearance')
    await app.page.locator(DIALOG).getByText('themes', { exact: true }).click()
    await app.page.locator(`${DIALOG} [class*="list-nested"]`).getByText('default', { exact: true }).click()
    await app.page.locator(`${DIALOG} [class*="trigger-btn"]`).first().click()
    const check = app.page.locator(`${DIALOG} [class*="btn-half"]`).nth(1)
    await check.waitFor()
    await app.page.waitForTimeout(150)
    const [box, dialog] = await Promise.all([check.boundingBox(), app.page.locator(DIALOG).boundingBox()])
    assert(box.y >= dialog.y && box.y + box.height <= dialog.y + dialog.height, 'confirm button is clipped: ' + JSON.stringify({ box, dialog }))
    await app.page.fill(`${DIALOG} input[placeholder^="Type color"]`, '#112233')
    await check.click()
    const swatch = await app.page.locator(`${DIALOG} [class*="trigger-btn"]`).first().textContent()
    assertEqual(swatch, '#112233', 'swatch after confirming')
    const stored = await storedSettings(app)
    assert(JSON.stringify(stored.appearance.themes.default).includes('#112233'), 'colour was not saved')
  },

  async 'dark scheme: the panel opens and its text is readable'(app) {
    await app.page.emulateMedia({ colorScheme: 'dark' })
    await openPanel(app)
    const contrast = await app.page.$eval(DIALOG, e => {
      const s = getComputedStyle(e)
      return { color: s.color, background: s.backgroundColor }
    })
    assert(contrast.color !== contrast.background, 'text and panel share a colour: ' + JSON.stringify(contrast))
  }
}
